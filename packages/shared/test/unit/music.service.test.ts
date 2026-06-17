import { describe, expect, it, vi } from 'vitest';
import * as Models from '../../src/models/index.js';
import { MusicService } from '../../src/services/music.service.js';

function makeMocks(options: { queue?: Partial<Models.Music>[]; info?: Partial<Models.MusicInfo> | null } = {}) {
  const musicRepository = {
    getAll: vi.fn().mockResolvedValue(options.queue ?? []),
    getQueue: vi.fn().mockResolvedValue(options.queue ?? []),
    saveAll: vi.fn().mockImplementation(async (_gid: string, _cid: string, musics: Models.Music[]) => musics),
    add: vi.fn().mockResolvedValue(true),
    addRange: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    resetPlayState: vi.fn().mockResolvedValue(true),
    updatePlayState: vi.fn().mockResolvedValue(true),
  };
  const musicInfoRepository = {
    get: vi.fn().mockResolvedValue(options.info ?? null),
    save: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(true),
  };
  const playlistRepository = {
    get: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([]),
    remove: vi.fn().mockResolvedValue(true),
  };
  const service = new MusicService(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    musicRepository as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    musicInfoRepository as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    playlistRepository as any
  );
  return { service, musicRepository, musicInfoRepository, playlistRepository };
}

function makeQueue(n: number): Partial<Models.Music>[] {
  return Array.from({ length: n }, (_, i) => ({
    guild_id: '100',
    channel_id: '200',
    music_id: i,
    title: `track-${i}`,
    url: `https://example.com/${i}`,
    thumbnail: '',
  }));
}

describe('MusicService.addTrack', () => {
  it('楽曲情報をエンティティのカラム名に変換して追加する', async () => {
    const { service, musicRepository } = makeMocks();
    await service.addTrack('100', '200', { title: 't', url: 'u', thumbnail: 'th' }, true);
    expect(musicRepository.add).toHaveBeenCalledWith(
      '100',
      '200',
      expect.objectContaining({ guild_id: '100', channel_id: '200', title: 't', url: 'u', thumbnail: 'th' }),
      true
    );
  });
});

describe('MusicService.shuffleQueue', () => {
  it('曲数が1以下なら null (シャッフル不要)', async () => {
    const { service, musicRepository } = makeMocks({ queue: makeQueue(1) });
    expect(await service.shuffleQueue('100', '200')).toBeNull();
    expect(musicRepository.saveAll).not.toHaveBeenCalled();
  });

  it('music_id を振り直して保存し、昇順で返す', async () => {
    const { service } = makeMocks({ queue: makeQueue(5) });
    const shuffled = await service.shuffleQueue('100', '200');
    expect(shuffled).not.toBeNull();
    // music_id は 0..4 の振り直し + 昇順ソート
    expect(shuffled?.map((m) => m.music_id)).toEqual([0, 1, 2, 3, 4]);
    // 元の全タイトルが保持されている
    expect(shuffled?.map((m) => m.title).sort()).toEqual(makeQueue(5).map((m) => m.title).sort());
  });
});

describe('MusicService.initPlayerSettings', () => {
  it('設定がなければ loop/shuffle フラグを保存し、shuffle 指定を返す', async () => {
    const { service, musicInfoRepository, musicRepository } = makeMocks({ info: null });
    const result = await service.initPlayerSettings('100', '200', true, true);
    expect(result.shouldShuffle).toBe(true);
    expect(musicInfoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ guild_id: '100', channel_id: '200', is_loop: 1 })
    );
    expect(musicInfoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ guild_id: '100', channel_id: '200', is_shuffle: 1 })
    );
    expect(musicRepository.resetPlayState).not.toHaveBeenCalled();
  });

  it('ループ設定があれば再生状態をリセットする', async () => {
    const { service, musicRepository } = makeMocks({ info: { is_loop: 1, is_shuffle: 0 } });
    const result = await service.initPlayerSettings('100', '200');
    expect(musicRepository.resetPlayState).toHaveBeenCalledWith('100', '200');
    expect(result.shouldShuffle).toBe(false);
  });

  it('シャッフル設定があれば shouldShuffle を返す', async () => {
    const { service } = makeMocks({ info: { is_loop: 0, is_shuffle: 1 } });
    const result = await service.initPlayerSettings('100', '200');
    expect(result.shouldShuffle).toBe(true);
  });
});

describe('MusicService toggle 系', () => {
  it('設定がなければ null', async () => {
    const { service } = makeMocks({ info: null });
    expect(await service.toggleShuffle('100', '200')).toBeNull();
    expect(await service.toggleLoop('100', '200')).toBeNull();
    expect(await service.toggleSilent('100', '200')).toBeNull();
  });

  it('toggleShuffle は 0/1 を反転して保存する', async () => {
    const { service, musicInfoRepository } = makeMocks({ info: { is_shuffle: 0 } });
    expect(await service.toggleShuffle('100', '200')).toBe(1);
    expect(musicInfoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ is_shuffle: 1 })
    );
  });

  it('toggleLoop は 1 を 0 に反転する', async () => {
    const { service } = makeMocks({ info: { is_loop: 1 } });
    expect(await service.toggleLoop('100', '200')).toBe(0);
  });

  it('toggleSilent は 0/1 を反転する', async () => {
    const { service } = makeMocks({ info: { silent: 1 } });
    expect(await service.toggleSilent('100', '200')).toBe(0);
  });
});

describe('MusicService.saveNowPlaying', () => {
  it('再生中の楽曲情報を保存する', async () => {
    const { service, musicInfoRepository } = makeMocks();
    await service.saveNowPlaying('100', '200', { title: 't', url: 'u', thumbnail: 'th' });
    expect(musicInfoRepository.save).toHaveBeenCalledWith({
      guild_id: '100',
      channel_id: '200',
      title: 't',
      url: 'u',
      thumbnail: 'th',
    });
  });
});

describe('MusicService プレイリスト', () => {
  it('リポジトリへ委譲する', async () => {
    const { service, playlistRepository } = makeMocks();
    await service.getPlaylists('1');
    expect(playlistRepository.getAll).toHaveBeenCalledWith('1');
    await service.getPlaylistByName('1', 'fav');
    expect(playlistRepository.get).toHaveBeenCalledWith('1', 'fav');
    await service.removePlaylist('1', 'fav');
    expect(playlistRepository.remove).toHaveBeenCalledWith('1', 'fav');
  });
});
