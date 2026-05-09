import { DataSource, DataSourceOptions } from 'typeorm';
import * as Models from '../models/index.js';

export type SharedDataSourceConfig = {
  host: string;
  username: string;
  password: string;
  port: number;
  database: string;
  logging?: boolean;
  synchronize?: boolean;
  dropSchema?: boolean;
};

let dataSource: DataSource | null = null;

export function createDataSource(config: SharedDataSourceConfig): DataSource {
  const options: DataSourceOptions = {
    type: 'mariadb',
    host: config.host,
    username: config.username,
    password: config.password,
    port: config.port,
    database: config.database,
    logging: config.logging ?? false,
    synchronize: config.synchronize ?? true,
    dropSchema: config.dropSchema ?? false,
    charset: 'utf8mb4',
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
  };
  dataSource = new DataSource(options);
  return dataSource;
}

export function getDataSource(): DataSource {
  if (!dataSource) {
    throw new Error('DataSource has not been initialized. Call createDataSource() before using repositories.');
  }
  return dataSource;
}

export function resetDataSource(): void {
  dataSource = null;
}
