import axios from 'axios';
import { CacheType, ChannelType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SpeakerRepository } from '../../model/repository/speakerRepository.js';

const SPEAKER_LEMON_URI = 'http://127.0.0.1:4100/speaker/call';
const SPEAKER_LIME_URI = 'http://127.0.0.1:4101/speaker/call';
const LEMON_SPEAKER_ID = '1052485316096835624';
const LIME_SPEAKER_ID = '1136472630426345502';

/**
 * 読み上げちゃんを呼び出す
 * @param interaction
 */
export async function call(interaction: ChatInputCommandInteraction<CacheType>) {
  await interaction.deferReply();

  // 今のチャンネルに読み上げが居たら呼ばない
  if (interaction.channel?.type !== ChannelType.GuildVoice) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('エラー')
      .setDescription(`ボイスチャンネルでのみ呼び出せます`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const voiceChannel = interaction.channel;
  if (
    voiceChannel.members.find((member) => member.user.id === LEMON_SPEAKER_ID || member.user.id === LIME_SPEAKER_ID)
  ) {
    const embed = new EmbedBuilder().setColor('Red').setTitle('エラー').setDescription(`もう誰かいるみたいだよ～？`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const speakerRepository = new SpeakerRepository();
  const speakers = await speakerRepository.getSpeakers(interaction.guild?.id ?? '');

  const unused = speakers.filter((speaker) => !speaker.is_used);

  if (unused.length === 0) {
    await interaction.editReply({ content: '使用できる読み上げちゃんが見つかりません' });
    return;
  }

  if (unused.find((speaker) => speaker.user_id === LEMON_SPEAKER_ID)) {
    await axios.post(SPEAKER_LEMON_URI, {
      guildId: interaction.guild?.id,
      channelId: interaction.channel?.id,
    });
    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('呼出: れもんちゃん')
      .setDescription(`.discon で終了`)
      .setFooter({ text: 'れもんちゃん、出番だよ～！' });
    await interaction.editReply({ embeds: [embed] });
  } else if (unused.find((speaker) => speaker.user_id === LIME_SPEAKER_ID)) {
    await axios.post(SPEAKER_LIME_URI, {
      guildId: interaction.guild?.id,
      channelId: interaction.channel?.id,
    });
    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('呼出: らいむちゃん')
      .setDescription(`.discon で終了`)
      .setFooter({ text: 'らいむちゃん、出番だよ～！' });
    await interaction.editReply({ embeds: [embed] });
  }
  return;
}

/**
 * 読み上げちゃんを強制的に呼び出す
 * @param userId
 */
export async function forceCall(guildId: string, channelId: string, userId: string) {
  const speakerRepository = new SpeakerRepository();
  const speakers = await speakerRepository.getSpeakers(guildId);
  const speaker = speakers.filter((speaker) => !speaker.is_used).find((speaker) => speaker.user_id === userId);
  if (!speaker) {
    return;
  }
  if (speaker.user_id === LEMON_SPEAKER_ID) {
    const response = await axios.post(SPEAKER_LEMON_URI, {
      guildId: guildId,
      channelId: channelId,
    });
  } else if (speaker.user_id === LIME_SPEAKER_ID) {
    const response = await axios.post(SPEAKER_LIME_URI, {
      guildId: guildId,
      channelId: channelId,
    });
  }
}
