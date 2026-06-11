import axios from 'axios';
import { CacheType, ChannelType, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js';
import { SpeakerRepository } from "@orangebot/shared";

const SPEAKER_LEMON_URI = 'http://127.0.0.1:4100/speaker/call';
const SPEAKER_LIME_URI = 'http://127.0.0.1:4101/speaker/call';
const SPEAKER_LEMON_DISCON_URI = 'http://127.0.0.1:4100/speaker/discon';
const SPEAKER_LIME_DISCON_URI = 'http://127.0.0.1:4101/speaker/discon';
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
 * 読み上げちゃんを切断する
 * @param interaction
 */
export async function discon(interaction: ChatInputCommandInteraction<CacheType>) {
  await interaction.deferReply();

  const member = interaction.member instanceof GuildMember ? interaction.member : null;
  const voiceChannel = member?.voice.channel;
  if (!voiceChannel) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('エラー')
      .setDescription(`ボイスチャンネルに入ってから使ってね`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const speaker = voiceChannel.members.find(
    (member) => member.user.id === LEMON_SPEAKER_ID || member.user.id === LIME_SPEAKER_ID
  );
  if (!speaker) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('エラー')
      .setDescription(`読み上げちゃんがいないみたいだよ～？`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const uri = speaker.user.id === LEMON_SPEAKER_ID ? SPEAKER_LEMON_DISCON_URI : SPEAKER_LIME_DISCON_URI;
  try {
    await axios.post(uri, {
      guildId: interaction.guild?.id,
      channelId: voiceChannel.id,
    });
  } catch (e) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('エラー')
      .setDescription(`切断に失敗しちゃった: ${(e as Error).message}`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor('Green')
    .setTitle('切断')
    .setDescription(`${speaker.displayName}を切断したよ`);
  await interaction.editReply({ embeds: [embed] });
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
