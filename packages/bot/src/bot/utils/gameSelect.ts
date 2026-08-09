import { ActivityType, EmbedBuilder, Guild, VoiceChannel } from 'discord.js';
import { Logger } from '../../common/logger.js';
import { DISCORD_CLIENT } from '../../constant/constants.js';
import { LogLevel } from '@orangebot/shared';

/**
 * ゲーム選択メッセージのタイトル
 * reactions.ts の判定に使うため、Embed のタイトルと完全一致させること
 */
export const GAME_SELECT_TITLE = 'ゲームの選択';

/**
 * ゲーム選択メッセージに付けるリアクション
 */
export const GAME_SELECT_EMOJI = '🎮';

/**
 * ユーザーのアクティビティからプレイ中のゲーム名を取得する
 * @param guild サーバ情報
 * @param userId ユーザーID
 * @returns ゲーム名 / プレイ中のゲームが無い場合は undefined
 */
export function getPlayingGame(guild: Guild, userId: string): string | undefined {
  const activity = guild.presences.cache
    .get(userId)
    ?.activities.find((a) => a.type === ActivityType.Playing && a.name.trim().length > 0);

  return activity?.name.trim();
}

/**
 * お部屋にゲーム選択用のリアクション付きメッセージを貼る
 * @param channel 対象のボイスチャンネル
 */
export async function sendGameSelectMessage(channel: VoiceChannel): Promise<void> {
  try {
    const embed = new EmbedBuilder()
      .setColor('#00cccc')
      .setTitle(GAME_SELECT_TITLE)
      .setDescription(
        [
          `お部屋のステータスをゲーム名にするときは ${GAME_SELECT_EMOJI} を押してね！`,
          '押した人がプレイ中のゲーム名をステータスに設定するよ～！',
        ].join('\n')
      );

    const message = await channel.send({ embeds: [embed] });
    await message.react(GAME_SELECT_EMOJI);
  } catch (e) {
    const err = e as Error;
    await Logger.put({
      guild_id: channel.guild.id,
      channel_id: channel.id,
      user_id: undefined,
      level: LogLevel.ERROR,
      event: 'game-select',
      message: [`send game select message failed`, err.message],
    });
  }
}

/**
 * ボイスチャンネルのチャンネルステータスを設定する
 * discord.js v14 に API が無いため REST を直接叩く
 * @param channelId 対象のチャンネルID
 * @param status 設定するステータス (空文字で解除)
 */
export async function setVoiceChannelStatus(channelId: string, status: string): Promise<void> {
  await DISCORD_CLIENT.rest.put(`/channels/${channelId}/voice-status`, {
    body: { status },
  });
}
