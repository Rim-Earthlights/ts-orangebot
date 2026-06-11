import { describe, expect, it, vi } from 'vitest';
import * as Models from '../../src/models/index.js';
import { RoomService } from '../../src/services/room.service.js';

function makeMockRepository(room: Partial<Models.Room> | null = null) {
  return {
    getRoom: vi.fn().mockResolvedValue(room),
    createRoom: vi.fn().mockResolvedValue(undefined),
    updateRoom: vi.fn().mockResolvedValue(undefined),
    deleteRoom: vi.fn().mockResolvedValue(true),
    getAutodeleteRooms: vi.fn().mockResolvedValue([]),
  };
}

describe('RoomService.renameRoom', () => {
  it('未登録なら null を返し、更新しない', async () => {
    const repository = makeMockRepository(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new RoomService(repository as any);
    expect(await service.renameRoom('1', 'new-name')).toBeNull();
    expect(repository.updateRoom).not.toHaveBeenCalled();
  });

  it('名前を更新し、is_live を保持して返す', async () => {
    const repository = makeMockRepository({ room_id: '1', name: 'old', is_live: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new RoomService(repository as any);
    const room = await service.renameRoom('1', 'new-name');
    expect(repository.updateRoom).toHaveBeenCalledWith('1', { name: 'new-name' });
    expect(room?.name).toBe('new-name');
    expect(room?.is_live).toBe(true);
  });
});

describe('RoomService.toggleAutoDelete', () => {
  it('フラグを反転して保存する', async () => {
    const repository = makeMockRepository({ room_id: '1', is_autodelete: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new RoomService(repository as any);
    expect(await service.toggleAutoDelete('1')).toBe(true);
    expect(repository.updateRoom).toHaveBeenCalledWith('1', expect.objectContaining({ is_autodelete: true }));
  });

  it('未登録なら null', async () => {
    const repository = makeMockRepository(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new RoomService(repository as any);
    expect(await service.toggleAutoDelete('1')).toBeNull();
  });
});

describe('RoomService.toggleLive', () => {
  it('baseName 指定時は [L] プレフィックスを除去して名前を更新する', async () => {
    const repository = makeMockRepository({ room_id: '1', name: 'room', is_live: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new RoomService(repository as any);
    const room = await service.toggleLive('1', '[L] my-room');
    expect(room?.is_live).toBe(true);
    expect(room?.name).toBe('my-room');
  });

  it('baseName 未指定時は名前を変更しない', async () => {
    const repository = makeMockRepository({ room_id: '1', name: 'room', is_live: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new RoomService(repository as any);
    const room = await service.toggleLive('1');
    expect(room?.is_live).toBe(false);
    expect(room?.name).toBe('room');
  });
});

describe('RoomService.registerRoom / unregisterRoom', () => {
  it('DTO をエンティティのカラム名に変換して登録する', async () => {
    const repository = makeMockRepository();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new RoomService(repository as any);
    await service.registerRoom({
      roomId: '1',
      guildId: '100',
      name: 'room',
      isAutodelete: true,
      isLive: false,
      isPrivate: false,
    });
    expect(repository.createRoom).toHaveBeenCalledWith({
      room_id: '1',
      guild_id: '100',
      name: 'room',
      is_autodelete: true,
      is_live: false,
      is_private: false,
    });

    expect(await service.unregisterRoom('1')).toBe(true);
    expect(repository.deleteRoom).toHaveBeenCalledWith('1');
  });
});

describe('RoomService.splitTeams', () => {
  it('全メンバーがチームに割り当てられ、人数差は1以内になる', () => {
    const members = Array.from({ length: 10 }, (_, i) => ({ id: `id-${i}`, name: `name-${i}` }));
    const teams = RoomService.splitTeams(members, 3);

    expect(teams).toHaveLength(10);
    // 全員が一度ずつ登場する
    expect(teams.map((t) => t.id).sort()).toEqual(members.map((m) => m.id).sort());
    // チーム番号は 0..2
    teams.forEach((t) => {
      expect(t.team).toBeGreaterThanOrEqual(0);
      expect(t.team).toBeLessThan(3);
    });
    // 人数差は1以内
    const counts = [0, 1, 2].map((n) => teams.filter((t) => t.team === n).length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    // 名前が正しく対応している
    teams.forEach((t) => {
      expect(t.name).toBe(`name-${t.id.replace('id-', '')}`);
    });
  });
});
