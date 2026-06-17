import { DataSource, DataSourceOptions } from 'typeorm';
import { SHARED_ENTITIES } from './entities.js';

export type SharedDataSourceConfig = {
  host: string;
  username: string;
  password: string;
  port: number;
  database: string;
  logging?: boolean;
  synchronize?: boolean;
  dropSchema?: boolean;
  migrations?: DataSourceOptions['migrations'];
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
    // スキーマはマイグレーションで管理する (Phase 2-1 で synchronize: true から切り替え)
    synchronize: config.synchronize ?? false,
    dropSchema: config.dropSchema ?? false,
    charset: 'utf8mb4',
    entities: SHARED_ENTITIES,
    migrations: config.migrations,
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
