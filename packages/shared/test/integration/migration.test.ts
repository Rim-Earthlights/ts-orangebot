import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SHARED_ENTITIES } from '../../src/config/entities.js';
import { MIGRATIONS } from '../../src/migrations/index.js';

/**
 * マイグレーションの正しさを検証するインテグレーションテスト。
 * テスト用 DB コンテナ (ルートの docker-compose.test.yml) を起動しておくこと:
 *   pnpm test:db:up && pnpm test:integration
 */
function createTestDataSource(): DataSource {
  return new DataSource({
    type: 'mariadb',
    host: process.env.TEST_DB_HOST ?? '127.0.0.1',
    port: Number(process.env.TEST_DB_PORT ?? 3307),
    username: process.env.TEST_DB_USERNAME ?? 'orangebot_test',
    password: process.env.TEST_DB_PASSWORD ?? 'orangebot_test',
    database: process.env.TEST_DB_DATABASE ?? 'orangebot_test',
    charset: 'utf8mb4',
    synchronize: false,
    entities: SHARED_ENTITIES,
    migrations: MIGRATIONS,
  });
}

async function getTableNames(dataSource: DataSource): Promise<string[]> {
  const rows: { TABLE_NAME: string }[] = await dataSource.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()`
  );
  return rows.map((r) => r.TABLE_NAME).sort();
}

describe('migrations', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = createTestDataSource();
    await dataSource.initialize();
    // 空の状態からマイグレーションを全適用する
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('全エンティティのテーブルが作成されている', async () => {
    const tables = await getTableNames(dataSource);
    const expected = [
      'bot_info',
      'chat_history',
      'color',
      'gacha',
      'guild',
      'item',
      'item_rank',
      'log',
      'migrations',
      'music',
      'music_info',
      'playlist',
      'role',
      'room',
      'speaker',
      'user_setting',
      'users',
    ];
    expect(tables).toEqual(expected);
  });

  it('マイグレーション適用後のスキーマがエンティティ定義と一致する (synchronize 差分なし)', async () => {
    const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();
    const pending = sqlInMemory.upQueries.map((q) => q.query);
    expect(pending).toEqual([]);
  });

  it('全マイグレーションが適用済みとして記録されている', async () => {
    const executed = await dataSource.showMigrations();
    // showMigrations() は未適用マイグレーションがあると true を返す
    expect(executed).toBe(false);
  });

  it('revert で全テーブルが削除され、再適用できる', async () => {
    // MIGRATIONS は現状1件 (InitialSchema) なので1回 revert すれば初期状態に戻る
    await dataSource.undoLastMigration();
    const tables = await getTableNames(dataSource);
    expect(tables).toEqual(['migrations']);

    // 後続のためにスキーマを再適用する
    await dataSource.runMigrations();
    const restored = await getTableNames(dataSource);
    expect(restored).toContain('users');
  });
});
