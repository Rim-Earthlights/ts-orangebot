import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDataSource, resetDataSource } from '../../src/config/datasource.js';
import { MIGRATIONS } from '../../src/migrations/index.js';
import * as Models from '../../src/models/index.js';
import { UsersType } from '../../src/models/users.js';
import { GachaRepository } from '../../src/repository/gachaRepository.js';
import { ItemRepository } from '../../src/repository/itemRepository.js';
import { UsersRepository } from '../../src/repository/usersRepository.js';

/**
 * リポジトリ層のインテグレーションテスト。
 * テスト用 DB コンテナ (ルートの docker-compose.test.yml) を起動しておくこと:
 *   pnpm test:db:up && pnpm test:integration
 */
const GUILD_ID = '1000';
const USER_ID = '1';

let dataSource: DataSource;

beforeAll(async () => {
  dataSource = createDataSource({
    host: process.env.TEST_DB_HOST ?? '127.0.0.1',
    port: Number(process.env.TEST_DB_PORT ?? 3307),
    username: process.env.TEST_DB_USERNAME ?? 'orangebot_test',
    password: process.env.TEST_DB_PASSWORD ?? 'orangebot_test',
    database: process.env.TEST_DB_DATABASE ?? 'orangebot_test',
    migrations: MIGRATIONS,
  });
  await dataSource.initialize();
  await dataSource.dropDatabase();
  await dataSource.runMigrations();

  // FK 制約 (users.guild_id → guild.id, users.id → user_setting.user_id) を満たすシード
  await dataSource.getRepository(Models.Guild).save({ id: GUILD_ID, name: 'test-guild' });
  await dataSource.getRepository(Models.UserSetting).save({ user_id: USER_ID });
});

afterAll(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
  resetDataSource();
});

describe('UsersRepository', () => {
  it('save / get でユーザーを登録・取得できる', async () => {
    const repository = new UsersRepository();
    await repository.save({
      id: USER_ID,
      guild_id: GUILD_ID,
      user_name: 'alice',
      pick_left: 5,
    });

    const user = await repository.get(GUILD_ID, USER_ID);
    expect(user).not.toBeNull();
    expect(user?.user_name).toBe('alice');
    expect(user?.pick_left).toBe(5);
    expect(user?.type).toBe(UsersType.MEMBER);
  });

  it('resetGacha で残り回数を再セットできる', async () => {
    const repository = new UsersRepository();
    await repository.resetGacha(GUILD_ID, USER_ID, 30);
    const user = await repository.get(GUILD_ID, USER_ID);
    expect(user?.pick_left).toBe(30);
  });

  it('getUsersType / updateUsersType で権限を取得・更新できる', async () => {
    const repository = new UsersRepository();
    expect(await repository.getUsersType(GUILD_ID, USER_ID)).toBe(UsersType.MEMBER);

    const updated = await repository.updateUsersType(GUILD_ID, USER_ID, UsersType.ADMIN);
    expect(updated?.type).toBe(UsersType.ADMIN);
  });

  it('delete (ソフトデリート) / getWithDeleted / restore', async () => {
    const repository = new UsersRepository();
    await repository.delete(GUILD_ID, USER_ID);
    expect(await repository.get(GUILD_ID, USER_ID)).toBeNull();

    const deleted = await repository.getWithDeleted(GUILD_ID, USER_ID);
    expect(deleted).not.toBeNull();
    expect(deleted?.deleted_at).not.toBeNull();

    await repository.restore(GUILD_ID, USER_ID);
    expect(await repository.get(GUILD_ID, USER_ID)).not.toBeNull();
  });
});

describe('ItemRepository', () => {
  it('init でランクとアイテムを初期投入できる', async () => {
    const repository = new ItemRepository();
    await repository.init([
      { name: 'すごい景品', rare: 'UUR', weight: 1, is_present: 1, reroll: 0, price: 10000 },
      { name: 'ふつうのアイテム', rare: 'C', weight: 10, is_present: 0, reroll: 0, price: 0 },
      { name: 'チケット', rare: 'C', weight: 5, is_present: 0, reroll: 1, price: 0 },
    ] as Models.Item[]);

    const items = await repository.getAll();
    expect(items).toHaveLength(3);
    // item_rank リレーションが解決されている
    const uur = items.find((i) => i.rare === 'UUR');
    expect(uur?.item_rank.rank).toBe(0);
  });

  it('既にアイテムがある場合 init は何もしない', async () => {
    const repository = new ItemRepository();
    await repository.init([{ name: '二重投入', rare: 'C', weight: 1 }] as Models.Item[]);
    const items = await repository.getAll();
    expect(items).toHaveLength(3);
  });

  it('get で等級指定の取得ができる', async () => {
    const repository = new ItemRepository();
    const items = await repository.get('C');
    expect(items).toHaveLength(2);
  });
});

describe('GachaRepository', () => {
  it('save / getHistory でガチャ履歴を保存・取得できる', async () => {
    const itemRepository = new ItemRepository();
    const items = await itemRepository.getAll();
    const present = items.find((i) => i.is_present === 1);
    const common = items.find((i) => i.is_present === 0);

    const repository = new GachaRepository();
    const pickDate = new Date('2026-06-01T00:00:00');
    await repository.save([
      { user_id: USER_ID, item_id: present?.id, pick_date: pickDate, is_used: 0 },
      { user_id: USER_ID, item_id: common?.id, pick_date: pickDate, is_used: 0 },
    ]);

    const history = await repository.getHistory(USER_ID);
    expect(history).toHaveLength(2);
    expect(history?.[0].items).toBeDefined();
  });

  it('getPresents は未使用のプレゼントのみ返す', async () => {
    const repository = new GachaRepository();
    const presents = await repository.getPresents(USER_ID, false);
    expect(presents).toHaveLength(1);
    expect(presents[0].items.is_present).toBe(1);
    expect(presents[0].is_used).toBe(0);
  });

  it('usePresent でプレゼントを使用済みにできる', async () => {
    const repository = new GachaRepository();
    const presents = await repository.getPresents(USER_ID, false);
    const used = await repository.usePresent(presents[0].id);
    expect(used?.is_used).toBe(1);
    expect(used?.items.name).toBe('すごい景品');

    // 使用後は未使用一覧から消える
    expect(await repository.getPresents(USER_ID, false)).toHaveLength(0);
    // 履歴 (hist) には残る
    expect(await repository.getPresents(USER_ID, true)).toHaveLength(1);
  });

  it('usePresent は存在しない ID なら null', async () => {
    const repository = new GachaRepository();
    expect(await repository.usePresent(99999)).toBeNull();
  });

  it('givePresent でプレゼントを付与できる', async () => {
    const itemRepository = new ItemRepository();
    const items = await itemRepository.getAll();
    const present = items.find((i) => i.is_present === 1);

    const repository = new GachaRepository();
    const given = await repository.givePresent(USER_ID, present!.id);
    expect(given?.items.name).toBe('すごい景品');

    expect(await repository.getPresents(USER_ID, false)).toHaveLength(1);
  });
});
