/**
 * TypeORM CLI 用の DataSource エントリ。
 *
 * - typeorm CLI (migration:generate / migration:run / migration:revert) はトップレベルで
 *   `export default new DataSource(...)` の形を要求するため、ランタイム用 (createDataSource)
 *   とは別にこのファイルを用意する。
 * - DB 接続情報は `.env` から取得する (DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_DATABASE)。
 * - migrations ディレクトリを `src/migrations/` に固定し、生成済みマイグレーションをここから読み込む。
 *
 * 実行例:
 *   pnpm --filter @orangebot/shared migration:generate src/migrations/AddUserIndex
 *   pnpm --filter @orangebot/shared migration:run
 *   pnpm --filter @orangebot/shared migration:revert
 *
 * NOTE: synchronize: true から false への切り替えは Phase 2-1 (Vitest 導入後) に行う。
 */

import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as Models from '../src/models/index.js';

const port = Number(process.env.DB_PORT ?? 3306);

if (Number.isNaN(port)) {
  throw new Error(`Invalid DB_PORT: ${process.env.DB_PORT}`);
}

export default new DataSource({
  type: 'mariadb',
  host: process.env.DB_HOST,
  port,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  charset: 'utf8mb4',
  // CLI 専用なので synchronize は常に false。マイグレーションのみで管理する。
  synchronize: false,
  logging: true,
  entities: [
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
  ],
  migrations: ['src/migrations/*.ts'],
});
