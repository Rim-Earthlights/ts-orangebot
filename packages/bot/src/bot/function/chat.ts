import dayjs from 'dayjs';
import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Logger } from '../../common/logger.js';
import { LiteLLMModel } from '../../config/config.js';
import { LiteLLMMode, Role, getIdInfoInteraction } from '../../constant/chat/chat.js';
import { LogLevel } from "@orangebot/shared";
import { createChatService } from '../adapters/chat.adapter.js';

/**
 * メモリ機能を切り替える
 * @param interaction
 */
export async function setMemory(interaction: ChatInputCommandInteraction<CacheType>) {
  const { id } = getIdInfoInteraction(interaction);
  if (!id) {
    return;
  }
  const memory = createChatService().toggleMemory(id);
  if (memory === null) {
    return;
  }
  await interaction.reply(`メモリ機能を${memory ? '有効化' : '無効化'}したよ！`);
}

/**
 * ユーザーのモデルタイプを取得する
 * @param userId
 * @returns
 */
export async function getUserModelType(userId: string): Promise<LiteLLMModel> {
  return (await createChatService().resolveUserModel(userId)) as LiteLLMModel;
}

/**
 * ChatGPTで会話する
 */
export async function talk(interaction: ChatInputCommandInteraction<CacheType>, content: string, mode: LiteLLMMode) {
  const { id, name, isGuild } = getIdInfoInteraction(interaction);
  if (!id) {
    return;
  }
  const chatService = createChatService();
  const model = await chatService.resolveUserModel(id);
  const liteLLM = chatService.getOrCreateSession(id, model, mode, isGuild);
  const llm = liteLLM.client;

  const systemContent = {
    server: { name: interaction.guild?.name },
    user: [{ mention_id: `<@${interaction.user.id}>`, name: interaction.user.displayName }],
    date: dayjs().format('YYYY/MM/DD HH:mm:ss'),
  };

  console.log(systemContent);

  const sendContent = `${JSON.stringify(systemContent)}\n${content}`;

  liteLLM.chat.push({
    role: Role.USER,
    content: sendContent,
  });

  const response = await llm.chat.completions.create({
    model: model,
    messages: liteLLM.chat,
  });

  const completion = response.choices[0].message;

  if (!completion.content) {
    const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`contentがnull`);
    await interaction.editReply({ embeds: [send] });
    return;
  }

  liteLLM.chat.push({ role: Role.ASSISTANT, content: completion.content });
  chatService.touchSession(id);

  if (completion.content.length > 2000) {
    const texts = completion.content.split('\n');
    let message = '';
    const chunks = [];
    for (const text of texts) {
      if (chunks[chunks.length - 1].length + text.length > 2000) {
        chunks.push(message);
        message = text + '\n';
      } else {
        message += text + '\n';
      }
    }
    await interaction.editReply(chunks.shift() ?? 'no response');
    for (const chunk of chunks) {
      await interaction.followUp({ content: chunk });
    }
  } else {
    await interaction.editReply(completion.content);
  }

  await chatService.saveHistory({
    uuid: liteLLM.uuid,
    channelId: id,
    name: name,
    content: liteLLM.chat,
    model: model,
    mode: LiteLLMMode.DEFAULT,
    isGuild,
  });

  await Logger.put({
    guild_id: interaction.guild?.id,
    channel_id: interaction.channel?.id,
    user_id: interaction.user.id,
    level: LogLevel.INFO,
    event: 'LiteLLM',
    message: [
      `responseId: ${response.id}`,
      `Usage: ${JSON.stringify(response.usage)}`,
      `Model: ${response.model}`,
      `Response: `,
      `${completion.content}`,
    ],
  });
}

/**
 * ChatGPTの会話データの削除
 */
export async function deleteChatData(interaction: ChatInputCommandInteraction<CacheType>, lastFlag?: boolean) {
  const { id } = getIdInfoInteraction(interaction);
  if (!id) {
    return;
  }
  const chatService = createChatService();
  const gpt = chatService.getSession(id);
  if (!gpt) {
    const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`会話データが削除済みだよ！`);
    await interaction.reply({ embeds: [send] });
    return;
  }

  if (lastFlag) {
    const eraseData = gpt.chat[gpt.chat.length - 1];
    gpt.chat.splice(gpt.chat.length - 2, 2);

    const send = new EmbedBuilder()
      .setColor('#00cc00')
      .setTitle(`直前の会話データを削除したよ～！`)
      .setDescription(`会話データ: \nid: ${gpt.id}\nmessage: ${eraseData.content}`);
    await interaction.reply({ embeds: [send] });
    return;
  }
  chatService.deleteSession(id);
  Logger.put({
    guild_id: interaction.guild?.id,
    channel_id: interaction.channel?.id,
    user_id: interaction.user.id,
    level: LogLevel.INFO,
    event: 'LiteLLM',
    message: [`Delete: ${gpt.id}`],
  });
  await interaction.reply('会話データを削除したよ～！');
}
