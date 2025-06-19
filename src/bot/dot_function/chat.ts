import axios from 'axios';
import dayjs from 'dayjs';
import { ActivityType, AttachmentBuilder, EmbedBuilder, Message } from 'discord.js';
import iconv from 'iconv-lite';
import OpenAI from 'openai';
import { ChatCompletionContentPart } from 'openai/resources/index.js';
import { Logger } from '../../common/logger.js';
import { CONFIG, LiteLLMModel } from '../../config/config.js';
import { llmList, initalize, LiteLLMMode, Role } from '../../constant/chat/chat.js';
import { PictureService } from '../../service/picture.service.js';
import { ModelResponse } from '../../type/openai.js';
import { LogLevel } from '../../type/types.js';
import { Forecast } from './index.js';
import { DISCORD_CLIENT } from '../../constant/constants.js';
import { UsersRepository } from '../../model/repository/usersRepository.js';

/**
 * モデルを設定する
 * @param message
 * @param model
 * @param mode
 */
export async function setModel(message: Message, model: LiteLLMModel, mode: LiteLLMMode) {
  const { id, isGuild } = getIdInfo(message);
  let llm = llmList.llm.find((c) => c.id === id);
  if (!llm) {
    llm = await initalize(id, model, mode, isGuild);
    llmList.llm.push(llm);
  }
  llm.model = model;
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
  const { id } = getIdInfo(message);
  const gpt = llmList.llm.find((c) => c.id === id);
  if (!gpt) {
    await message.reply(`履歴が存在しません。`);
    return;
  }
  gpt.memory = !gpt.memory;
  await message.reply(`メモリ機能を${gpt.memory ? '有効化' : '無効化'}したよ！`);
}

/**
 * ChatGPTで会話する
 */
export async function talk(message: Message, content: string, model: LiteLLMModel, mode: LiteLLMMode) {
  const { id, isGuild } = getIdInfo(message);
  let gpt = llmList.llm.find((c) => c.id === id);
  if (!gpt) {
    gpt = await initalize(id, model, mode, isGuild);
    llmList.llm.push(gpt);
  }
  const openai = gpt.litellm;
  let weather = undefined;

  if (content.includes(`天気`)) {
    const cityName = await Forecast.getPref(message.author.id);
    if (!cityName) {
      weather = { error: 'weather not register, please enter `.reg pref [pref_name]`' };
    } else {
      const when = message.content.match(/今日|明日|明後日|\d日後/);
      let day = 0;
      if (when != null) {
        if (when[0] === '明日') {
          day++;
        } else if (when[0] === '明後日') {
          day += 2;
        } else if (when[0].includes('日後')) {
          const d = when[0].replace('日後', '');
          day = Number(d);
        }
      }
      weather = await Forecast.weatherJson(message, [cityName, day.toString()]);
    }
  }

  const userRepository = new UsersRepository();

  const user = message.mentions.users.map((u) => {
    const presence = message.guild?.presences.cache.get(u.id);
    return {
      mention_id: `<@${u.id}>`,
      name: u.displayName,
      activity: presence?.activities.map((a) => {
        return {
          type: ActivityType[a.type],
          name: a.name,
          details: a.details,
          state: a.state,
        };
      }),
    };
  });

  if (!user.find((u) => u.mention_id === `<@${message.author.id}>`)) {
    const userInfo = await userRepository.getByUid(message.author.id);

    const presence = DISCORD_CLIENT.guilds.cache
      .get(userInfo?.guild_id ?? '1017341244508225596')
      ?.presences.cache.get(message.author.id);

    // const presence = message.guild?.presences.cache.get(message.author.id);

    user.push({
      mention_id: `<@${message.author.id}>`,
      name: message.author.displayName,
      activity: presence?.activities.map((a) => {
        return {
          type: ActivityType[a.type],
          name: a.name,
          details: a.details,
          state: a.state,
        };
      }),
    });
  }

  const systemContent = {
    server: { name: message.guild?.name },
    user,
    date: dayjs().format('YYYY/MM/DD HH:mm:ss'),
    weather,
  };

  const sendContent = `${JSON.stringify(systemContent)}\n${content}`;

  if (message.attachments) {
    const urls = await Promise.all(
      message.attachments.map(async (a) => {
        const fileName = a.name;

        const contentTypes = a.contentType?.split('; ');
        const contentType = contentTypes?.[0];
        const charset = contentTypes?.[1]?.replace('charset=', '');
        if (!contentType) {
          return { type: 'text', text: `error: contentType is null or undefined` };
        }

        if (contentType?.includes('image/')) {
          const { data } = (await axios.get(a.url, { responseType: 'arraybuffer' })) as { data: Buffer };

          if (data.length > 1 * 1024 * 1024) {
            const pictureService = new PictureService();
            const compressedImage = await pictureService.compressImage(data, contentType, 1);
            return { type: 'image_url', image_url: { url: compressedImage } };
          } else {
            const base64Image = `data:${contentType};base64,${data.toString('base64')}`;
            return { type: 'image_url', image_url: { url: base64Image } };
          }
        }

        if (a.size > 100_000) {
          return { type: 'text', text: `error: file size is too large, max size is 100KB. file: ${fileName}` };
        }

        const { data: fileData } = (await axios.get(a.url, { responseType: 'arraybuffer' })) as { data: Buffer };
        const text = iconv.decode(fileData, charset === 'SHIFT_JIS' ? 'SHIFT_JIS' : 'utf-8');

        if (contentType?.includes('application/json')) {
          return {
            type: 'text',
            text: [`file: ${fileName}`, '```json', JSON.stringify(text, null, 2), '```'].join('\n'),
          };
        } else if (contentType?.includes('application/javascript')) {
          return { type: 'text', text: [`file: ${fileName}`, '```javascript', text, '```'].join('\n') };
        } else if (contentType?.includes('video/MP2T')) {
          return { type: 'text', text: [`file: ${fileName}`, '```typescript', text, '```'].join('\n') };
        } else if (contentType?.includes('text/')) {
          return {
            type: 'text',
            text: [`file: ${fileName}`, '```' + contentType?.split('/')[1], text, '```'].join('\n'),
          };
        } else {
          return { type: 'text', text: `not support file type: [${a.contentType}]` };
        }
      })
    );

    gpt.chat.push({
      role: Role.USER,
      content: [{ type: 'text', text: sendContent }, ...urls] as Array<ChatCompletionContentPart>,
    });
  } else {
    gpt.chat.push({
      role: Role.USER,
      content: sendContent,
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: gpt.model,
      messages: gpt.chat,
    });
    const completion = response.choices[0].message;

    if (!completion.content) {
      const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`contentがnull`);
      await message.reply({ embeds: [send] });
      return;
    }

    gpt.chat.push({ role: Role.ASSISTANT, content: completion.content });
    gpt.timestamp = dayjs();

    if (completion.content.length > 2000) {
      const texts = completion.content.split('\n');
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
    } else {
      await message.reply(completion.content);
    }

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
  const openai = new OpenAI({
    organization: CONFIG.OPENAI.ORG,
    project: CONFIG.OPENAI.PROJECT,
    apiKey: CONFIG.OPENAI.KEY,
    maxRetries: 3,
  });
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: chat,
    n: 1,
    size: '1024x1024',
  });
  const image_url = response.data[0].url;

  if (!image_url) {
    return;
  }

  const send = new EmbedBuilder().setColor('#00cccc').setTitle(`出力画像`).setImage(image_url);
  message.reply({ embeds: [send] });
}

export async function deleteChatData(message: Message, idx?: string) {
  const { id } = getIdInfo(message);

  const llm = llmList.llm.find((c) => c.id === id);
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
  llmList.llm = llmList.llm.filter((c) => c.id !== id);
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

function getIdInfo(message: Message) {
  const guild = message.guild;
  if (!guild) {
    return { id: message.channel.id, isGuild: false };
  }
  return { id: guild.id, isGuild: true };
}
