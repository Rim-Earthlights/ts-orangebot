/**
 * チャット機能の Discord アダプター
 * セッション管理・履歴永続化は @orangebot/shared の ChatService が担当し、
 * ここでは Discord (Message) との橋渡しと Embed 整形を行う (Phase 2-3)
 */
import axios from 'axios';
import dayjs from 'dayjs';
import { AttachmentBuilder, EmbedBuilder, Message } from 'discord.js';
import OpenAI from 'openai';
import { Logger } from '../../common/logger.js';
import { CONFIG, LiteLLMModel } from '../../config/config.js';
import { getIdInfoMessage } from '../../constant/chat/chat.js';
import { CHATBOT_TEMPLATE, DISCORD_CLIENT } from '../../constant/constants.js';
import { ModelResponse } from '../../type/openai.js';
import { ChatRole, ChatService, LiteLLMMode, LogLevel } from '@orangebot/shared';
import { findTool, toolRegistry, ToolContext } from '../dot_function/chat_tools/index.js';
import { processAttachments } from '../dot_function/chat_attachments.js';

/**
 * bot の設定値から ChatService を生成する
 */
export function createChatService(): ChatService {
  return new ChatService({
    apiKey: CONFIG.OPENAI.KEY,
    organization: CONFIG.OPENAI.ORG,
    project: CONFIG.OPENAI.PROJECT,
    baseURL: CONFIG.OPENAI.BASE_URL,
    systemTemplate: CHATBOT_TEMPLATE,
    models: {
      default: CONFIG.OPENAI.DEFAULT_MODEL,
      low: CONFIG.OPENAI.LOW_MODEL,
      high: CONFIG.OPENAI.HIGH_MODEL,
    },
  });
}

/**
 * モデルを設定する
 * @param message
 * @param model
 * @param mode
 */
export async function setModel(message: Message, model: LiteLLMModel, mode: LiteLLMMode) {
  const { id, isGuild } = getIdInfoMessage(message);
  const chatService = createChatService();
  const session = chatService.getOrCreateSession(id, model, mode, isGuild);
  session.model = model;
  await message.reply(`モデルを設定. Model: ${model}`);
}

export async function getModel(message: Message) {
  const response = await axios.get<ModelResponse>(`${CONFIG.OPENAI.BASE_URL}/models`, {
    headers: {
      Authorization: `Bearer ${CONFIG.OPENAI.KEY}`,
    },
  });
  const models = response.data.data;
  const content = models.map((m) => {
    return `${m.id}`;
  });
  const send = new EmbedBuilder().setColor('#00cc00').setTitle(`モデル一覧`).setDescription(content.join('\n'));
  await message.reply({ embeds: [send] });
}

export async function setMemory(message: Message) {
  const { id } = getIdInfoMessage(message);
  const chatService = createChatService();
  const memory = chatService.toggleMemory(id);
  if (memory === null) {
    await message.reply(`履歴が存在しません。`);
    return;
  }
  await message.reply(`メモリ機能を${memory ? '有効化' : '無効化'}したよ！`);
}

/**
 * ユーザーのモデルタイプを取得する
 * @param userId
 * @returns
 */
export async function getUserModelType(userId: string): Promise<LiteLLMModel> {
  return (await createChatService().resolveUserModel(userId)) as LiteLLMModel;
}

async function replyChunked(message: Message, content: string) {
  if (content.length <= 2000) {
    await message.reply(content);
    return;
  }
  const texts = content.split('\n');
  let chunk = '';
  for (const text of texts) {
    if (chunk.length + text.length > 2000) {
      await message.reply(chunk + '\n');
      chunk = '';
    } else {
      chunk += text + '\n';
    }
  }
  if (chunk.length > 0) {
    await message.reply(chunk);
  }
}

/**
 * ChatGPTで会話する
 */
export async function talk(message: Message, content: string, mode: LiteLLMMode) {
  const { id, name, isGuild } = getIdInfoMessage(message);
  const chatService = createChatService();
  const model = await chatService.resolveUserModel(id);
  const llm = chatService.getOrCreateSession(id, model, mode, isGuild);
  const openai = llm.client;

  const user = message.mentions.users.map((u) => ({
    mention_id: `<@${u.id}>`,
    name: u.displayName,
  }));

  if (!user.find((u) => u.mention_id === `<@${message.author.id}>`)) {
    user.push({
      mention_id: `<@${message.author.id}>`,
      name: message.author.displayName,
    });
  }

  const systemContent = {
    server: { name: message.guild?.name },
    user,
    date: dayjs().format('YYYY/MM/DD HH:mm:ss'),
  };

  const sendContent = `${JSON.stringify(systemContent)}\n${content}`;

  if (message.attachments.size > 0) {
    const urls = await processAttachments(message);
    llm.chat.push({
      role: ChatRole.USER,
      content: [{ type: 'text', text: sendContent }, ...urls],
    });
  } else {
    llm.chat.push({
      role: ChatRole.USER,
      content: sendContent,
    });
  }

  try {
    const tools = toolRegistry.map((t) => t.definition);
    const toolCtx: ToolContext = {
      message,
      authorId: message.author.id,
      guildId: message.guild?.id,
    };

    let response = await openai.chat.completions.create({
      model: llm.model,
      messages: llm.chat,
      tools: tools.length > 0 ? tools : undefined,
    });

    const MAX_TOOL_ITERATIONS = 5;
    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      const toolCalls = response.choices[0].message.tool_calls;
      if (!toolCalls || toolCalls.length === 0) break;

      const assistantMsg = response.choices[0].message;
      llm.chat.push({
        role: ChatRole.ASSISTANT,
        content: assistantMsg.content ?? '',
        tool_calls: toolCalls,
      });

      if (assistantMsg.content && assistantMsg.content.trim().length > 0) {
        await replyChunked(message, assistantMsg.content);
      }

      for (const call of toolCalls) {
        if (call.type !== 'function') continue;
        const tool = findTool(call.function.name);
        let result: string;
        if (!tool) {
          result = JSON.stringify({ error: `unknown tool: ${call.function.name}` });
        } else {
          try {
            const parsedArgs = call.function.arguments ? JSON.parse(call.function.arguments) : {};
            result = await tool.handler(parsedArgs, toolCtx);
          } catch (e) {
            result = JSON.stringify({ error: (e as Error).message });
          }
        }
        llm.chat.push({
          role: 'tool',
          tool_call_id: call.id,
          content: result,
        });
      }

      response = await openai.chat.completions.create({
        model: llm.model,
        messages: llm.chat,
        tools: tools.length > 0 ? tools : undefined,
      });
    }

    const completion = response.choices[0].message;

    if (!completion.content) {
      const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`contentがnull`);
      await message.reply({ embeds: [send] });
      return;
    }

    llm.chat.push({ role: ChatRole.ASSISTANT, content: completion.content });
    chatService.touchSession(id);

    await replyChunked(message, completion.content);

    await chatService.saveHistory({
      uuid: llm.uuid,
      botId: DISCORD_CLIENT.user!.id,
      channelId: id,
      name: name,
      content: llm.chat,
      model: llm.model,
      mode: LiteLLMMode.DEFAULT,
      isGuild,
    });

    await Logger.put({
      guild_id: message.guild?.id,
      channel_id: message.channel.id,
      user_id: message.author.id,
      level: LogLevel.INFO,
      event: 'LiteLLM',
      message: [
        `ResponseId: ${response.id}`,
        `Usage: ${JSON.stringify(response.usage)}`,
        `Model: ${response.model}`,
        `systemContent: ${JSON.stringify(systemContent)}`,
        `Response:`,
        `${completion.content}`,
      ],
    });
  } catch (e) {
    console.error(e);
    await message.reply(`エラーが発生しました。\n\`\`\`\n${(e as Error).message}\n\`\`\``);
    return;
  }
}

/**
 * テキストから音声を出力する
 * @param message
 * @param chat
 */
export async function speech(message: Message, chat: string) {
  const openai = new OpenAI({
    organization: CONFIG.OPENAI.ORG,
    project: CONFIG.OPENAI.PROJECT,
    apiKey: CONFIG.OPENAI.KEY,
    maxRetries: 3,
  });
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: chat,
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  const attachment = new AttachmentBuilder(buffer, { name: 'speech.mp3' });
  await message.reply({ files: [attachment] });
}

/**
 * プロンプトから画像を生成する
 * @param message
 * @param chat
 * @returns
 */
export async function generatePicture(message: Message<boolean>, chat: string) {
  const litellm = new OpenAI({
    organization: CONFIG.OPENAI.ORG,
    project: CONFIG.OPENAI.PROJECT,
    apiKey: CONFIG.OPENAI.KEY,
    maxRetries: 3,
    baseURL: CONFIG.OPENAI.BASE_URL,
  });

  const response = await litellm.images.generate({
    model: 'openai-dall-e-3',
    prompt: chat,
    n: 1,
    size: '1024x1024',
  });

  if (!response.data) {
    return;
  }

  const image_url = response.data[0].url;

  if (!image_url) {
    return;
  }

  const send = new EmbedBuilder().setColor('#00cccc').setTitle(`出力画像`).setImage(image_url);
  message.reply({ embeds: [send] });
}

export async function deleteChatData(message: Message, idx?: string) {
  const { id } = getIdInfoMessage(message);
  const chatService = createChatService();

  const llm = chatService.getSession(id);
  if (!llm) {
    return;
  }

  if (idx != undefined) {
    const eraseData = llm.chat[llm.chat.length - 1];
    llm.chat.splice(llm.chat.length - 1, 2);

    const send = new EmbedBuilder()
      .setColor('#00cc00')
      .setTitle(`直前の会話データを削除したよ～！`)
      .setDescription(`会話データ: \ncid: ${llm.id}\nmessage: ${eraseData.content}`);
    await message.reply({ embeds: [send] });
    return;
  }
  chatService.deleteSession(id);
  Logger.put({
    guild_id: message.guild?.id,
    channel_id: message.channel.id,
    user_id: message.author.id,
    level: LogLevel.INFO,
    event: 'LiteLLM',
    message: [`Delete: ${llm.id}`],
  });
  await message.reply('会話データを削除したよ～！');
}
