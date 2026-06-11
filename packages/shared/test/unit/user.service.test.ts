import { describe, expect, it, vi } from 'vitest';
import { UsersType } from '../../src/models/users.js';
import { UserService } from '../../src/services/user.service.js';

function makeMockRepository(overrides: Record<string, unknown> = {}) {
  return {
    get: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    getUsersType: vi.fn().mockResolvedValue(null),
    updateUsersType: vi.fn().mockResolvedValue(null),
    resetGacha: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const USER_ROW = {
  id: '1',
  guild_id: '100',
  user_name: 'alice',
  type: UsersType.MEMBER,
  pick_left: 5,
  last_pick_date: null,
  voice_channel_data: null,
};

describe('UserService.getUser', () => {
  it('エンティティを UserDto に変換して返す', async () => {
    const repository = makeMockRepository({ get: vi.fn().mockResolvedValue(USER_ROW) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new UserService(repository as any);
    const user = await service.getUser('100', '1');
    expect(user).toEqual({
      id: '1',
      guildId: '100',
      userName: 'alice',
      type: UsersType.MEMBER,
      pickLeft: 5,
      lastPickDate: null,
      voiceChannelData: null,
    });
  });

  it('未登録なら null', async () => {
    const repository = makeMockRepository();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new UserService(repository as any);
    expect(await service.getUser('100', '1')).toBeNull();
  });
});

describe('UserService.hasUserType', () => {
  it('一致する権限なら true', async () => {
    const repository = makeMockRepository({ getUsersType: vi.fn().mockResolvedValue(UsersType.ADMIN) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new UserService(repository as any);
    expect(await service.hasUserType('100', '1', UsersType.ADMIN)).toBe(true);
  });

  it('OWNER は常に true', async () => {
    const repository = makeMockRepository({ getUsersType: vi.fn().mockResolvedValue(UsersType.OWNER) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new UserService(repository as any);
    expect(await service.hasUserType('100', '1', UsersType.ADMIN)).toBe(true);
  });

  it('権限が異なる場合・未登録の場合は false', async () => {
    const repository = makeMockRepository({ getUsersType: vi.fn().mockResolvedValue(UsersType.MEMBER) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new UserService(repository as any);
    expect(await service.hasUserType('100', '1', UsersType.ADMIN)).toBe(false);

    const emptyRepository = makeMockRepository();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emptyService = new UserService(emptyRepository as any);
    expect(await emptyService.hasUserType('100', '1', UsersType.ADMIN)).toBe(false);
  });
});

describe('UserService.resetGachaCount', () => {
  it('ユーザーが存在すれば回数を再セットして返す', async () => {
    const repository = makeMockRepository({ get: vi.fn().mockResolvedValue(USER_ROW) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new UserService(repository as any);
    const user = await service.resetGachaCount('100', '1', 30);
    expect(repository.resetGacha).toHaveBeenCalledWith('100', '1', 30);
    expect(user?.pickLeft).toBe(30);
  });

  it('未登録なら null を返し、再セットしない', async () => {
    const repository = makeMockRepository();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new UserService(repository as any);
    expect(await service.resetGachaCount('100', '1')).toBeNull();
    expect(repository.resetGacha).not.toHaveBeenCalled();
  });
});

describe('UserService.deleteUser', () => {
  it('ユーザーが存在すれば削除して true', async () => {
    const repository = makeMockRepository({ get: vi.fn().mockResolvedValue(USER_ROW) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new UserService(repository as any);
    expect(await service.deleteUser('100', '1')).toBe(true);
    expect(repository.delete).toHaveBeenCalledWith('100', '1');
  });

  it('未登録なら false', async () => {
    const repository = makeMockRepository();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new UserService(repository as any);
    expect(await service.deleteUser('100', '1')).toBe(false);
    expect(repository.delete).not.toHaveBeenCalled();
  });
});

describe('UserService.registerUser', () => {
  it('リクエスト内容でリポジトリに保存する', async () => {
    const repository = makeMockRepository();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new UserService(repository as any);
    await service.registerUser({ guildId: '100', userId: '1', userName: 'alice', pickLeft: 10 });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', guild_id: '100', user_name: 'alice', pick_left: 10 })
    );
  });
});
