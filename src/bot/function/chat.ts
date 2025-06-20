import dayjs from 'dayjs';
import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Logger } from '../../common/logger.js';
import { LiteLLMModel } from '../../config/config.js';
import { LiteLLMMode, Role, llmList, initalize, getIdInfoInteraction } from '../../constant/chat/chat.js';
import { LogLevel } from '../../type/types.js';
import { ChatHistoryRepository } from '../../model/repository/chatHistoryRepository.js';
import { ChatHistoryChannelType } from '../../model/models/chatHistory.js';

/**
 * メモリ機能を切り替える
 * @param interaction
 */
export async function setMemory(interaction: ChatInputCommandInteraction<CacheType>) {
  const { id } = getIdInfoInteraction(interaction);
  if (!id) {
    return;
  }
  const gpt = llmList.llm.find((c) => c.id === id);
  if (!gpt) {
    return;
  }
  gpt.memory = !gpt.memory;
  await interaction.reply(`メモリ機能を${gpt.memory ? '有効化' : '無効化'}したよ！`);
}

/**
 * ChatGPTで会話する
 */
export async function talk(
  interaction: ChatInputCommandInteraction<CacheType>,
  content: string,
  model: LiteLLMModel,
  mode: LiteLLMMode
) {
  const { id, name, isGuild } = getIdInfoInteraction(interaction);
  if (!id) {
    return;
  }
  let liteLLM = llmList.llm.find((c) => c.id === id);
  if (!liteLLM) {
    liteLLM = await initalize(id, model, mode, isGuild);
    llmList.llm.push(liteLLM);
  }
  const llm = liteLLM.litellm;

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
  liteLLM.timestamp = dayjs();

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

  const chatHistoryRepository = new ChatHistoryRepository();
  await chatHistoryRepository.save({
    uuid: liteLLM.uuid,
    channel_id: id,
    name: name,
    content: liteLLM.chat,
    model: model,
    mode: LiteLLMMode.DEFAULT,
    channel_type: isGuild ? ChatHistoryChannelType.GUILD : ChatHistoryChannelType.DM,
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
  const gpt = llmList.llm.find((c) => c.id === id);
  if (!gpt) {
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
  llmList.llm = llmList.llm.filter((c) => c.id !== id);
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
