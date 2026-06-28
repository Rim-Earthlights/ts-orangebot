import { Guild } from 'discord.js';

const DEFAULT_ROOM_NAME_PREFIX = 'お部屋: #';
const DEFAULT_ROOM_NAME_PATTERN = /お部屋: #(\d+)/;

/**
 * ボイスチャンネルのデフォルト名を取得する
 * @param guild サーバ情報
 * @returns お部屋: #nnn 形式の名前
 */
export function getDefaultRoomName(guild: Guild): string {
  const roomNumbers = guild.channels.cache
    .map((channel) => DEFAULT_ROOM_NAME_PATTERN.exec(channel.name)?.[1])
    .filter((roomNumber): roomNumber is string => roomNumber != null)
    .map((roomNumber) => Number(roomNumber))
    .filter((roomNumber) => Number.isFinite(roomNumber));

  const nextRoomNumber = roomNumbers.length > 0 ? Math.max(...roomNumbers) + 1 : 1;

  return `${DEFAULT_ROOM_NAME_PREFIX}${String(nextRoomNumber).padStart(3, '0')}`;
}
