import { CacheType, ChatInputCommandInteraction, EmbedBuilder, Interaction } from 'discord.js';
import { getRndNumber } from '../../common/common.js';

export async function rollHideDice(interaction: ChatInputCommandInteraction<CacheType>, num: number, max: number) {
  const result = [];
  for (let i = 0; i < num; i++) {
    result.push(getRndNumber(1, max));
  }

  const send = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('サイコロ振ったよ～！')
    .setDescription(result.join(', '))
    .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/dice.jpg');

  await interaction.editReply({ embeds: [send] });
}
