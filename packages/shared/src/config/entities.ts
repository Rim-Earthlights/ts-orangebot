import * as Models from '../models/index.js';

/**
 * shared が管理する全エンティティ。
 * ランタイム (createDataSource) / CLI (data-source-cli) / テストで共用する。
 */
export const SHARED_ENTITIES = [
  Models.Users,
  Models.Gacha,
  Models.Music,
  Models.MusicInfo,
  Models.Playlist,
  Models.Item,
  Models.Guild,
  Models.ItemRank,
  Models.Log,
  Models.Role,
  Models.Color,
  Models.Room,
  Models.Speaker,
  Models.UserSetting,
  Models.ChatHistory,
  Models.BotInfo,
];
