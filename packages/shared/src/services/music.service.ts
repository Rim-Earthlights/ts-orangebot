import { getRndArray } from '../common/random.js';
import * as Models from '../models/index.js';
import { MusicInfoRepository } from '../repository/musicInfoRepository.js';
import { MusicRepository } from '../repository/musicRepository.js';
import { PlaylistRepository } from '../repository/playlistRepository.js';
import { MusicAddItem } from '../types/music.js';

/** ユニットテストでリポジトリをモックできるよう、利用メソッドのみを依存として宣言する */
type MusicRepositoryLike = Pick<
  MusicRepository,
  'getAll' | 'getQueue' | 'saveAll' | 'add' | 'addRange' | 'remove' | 'resetPlayState' | 'updatePlayState'
>;
type MusicInfoRepositoryLike = Pick<MusicInfoRepository, 'get' | 'save' | 'remove'>;
type PlaylistRepositoryLike = Pick<PlaylistRepository, 'get' | 'getAll' | 'remove'>;

/**
 * キューに追加する楽曲情報
 */
export interface MusicTrack {
  title: string;
  url: string;
  thumbnail: string;
}

/**
 * 音楽キュー管理サービス (Discord 非依存)
 *
 * 音声接続・ストリーミング再生は bot 側のアダプターが担当し、
 * 本サービスはキュー・再生設定・プレイリストの DB 状態のみを扱う。
 */
export class MusicService {
  constructor(
    private readonly musicRepository: MusicRepositoryLike = new MusicRepository(),
    private readonly musicInfoRepository: MusicInfoRepositoryLike = new MusicInfoRepository(),
    private readonly playlistRepository: PlaylistRepositoryLike = new PlaylistRepository()
  ) {}

  /**
   * 未再生のキューを取得する
   */
  async getQueue(guildId: string, channelId: string): Promise<Models.Music[]> {
    return await this.musicRepository.getQueue(guildId, channelId);
  }

  /**
   * 楽曲をキューに追加する
   * @param interrupt 先頭への割込予約
   */
  async addTrack(guildId: string, channelId: string, track: MusicTrack, interrupt = false): Promise<boolean> {
    return await this.musicRepository.add(
      guildId,
      channelId,
      {
        guild_id: guildId,
        channel_id: channelId,
        title: track.title,
        url: track.url,
        thumbnail: track.thumbnail,
      },
      interrupt
    );
  }

  /**
   * 複数の楽曲をキューに追加する (プレイリスト取込)
   */
  async addTracks(
    guildId: string,
    channelId: string,
    tracks: MusicAddItem[],
    source: 'youtube' | 'spotify'
  ): Promise<boolean> {
    return await this.musicRepository.addRange(guildId, channelId, tracks, source);
  }

  /**
   * キューから楽曲を削除する (musicId 未指定時は全削除)
   */
  async removeTracks(guildId: string, channelId: string, musicId?: number): Promise<boolean> {
    return await this.musicRepository.remove(guildId, channelId, musicId);
  }

  /**
   * キュー全体をシャッフルする
   * @returns シャッフル後のキュー (music_id 昇順)。曲数が1以下の場合は null (シャッフル不要)
   */
  async shuffleQueue(guildId: string, channelId: string): Promise<Models.Music[] | null> {
    const musics = await this.musicRepository.getAll(guildId, channelId);

    const length = musics.length;
    if (length <= 1) {
      return null;
    }
    const rnd = getRndArray(musics.length);

    for (let i = 0; i < length; i++) {
      musics[i].music_id = rnd[i];
    }

    const shuffled = await this.musicRepository.saveAll(guildId, channelId, musics);
    shuffled.sort((a, b) => a.music_id - b.music_id);
    return shuffled;
  }

  /**
   * 楽曲の再生状態を更新する
   */
  async updatePlayState(guildId: string, channelId: string, musicId: number, state: boolean): Promise<void> {
    await this.musicRepository.updatePlayState(guildId, channelId, musicId, state);
  }

  /**
   * 全楽曲の再生状態をリセットする
   */
  async resetAllPlayState(guildId: string, channelId: string): Promise<void> {
    await this.musicRepository.resetPlayState(guildId, channelId);
  }

  /**
   * 再生設定を取得する
   */
  async getSettings(guildId: string, channelId: string): Promise<Models.MusicInfo | null> {
    return await this.musicInfoRepository.get(guildId, channelId);
  }

  /**
   * 再生設定を削除する
   */
  async removeSettings(guildId: string, channelId: string): Promise<boolean> {
    return await this.musicInfoRepository.remove(guildId, channelId);
  }

  /**
   * 再生開始時の設定初期化を行う
   * @returns shouldShuffle: キューのシャッフルが必要かどうか
   */
  async initPlayerSettings(
    guildId: string,
    channelId: string,
    loop?: boolean,
    shuffle?: boolean
  ): Promise<{ shouldShuffle: boolean }> {
    const info = await this.musicInfoRepository.get(guildId, channelId);

    if (!info) {
      await this.musicInfoRepository.save({
        guild_id: guildId,
        channel_id: channelId,
        is_loop: loop ? 1 : 0,
      });
      await this.musicInfoRepository.save({
        guild_id: guildId,
        channel_id: channelId,
        is_shuffle: shuffle ? 1 : 0,
      });
      return { shouldShuffle: !!shuffle };
    }

    if (info.is_loop) {
      await this.musicRepository.resetPlayState(guildId, channelId);
    }
    return { shouldShuffle: !!info.is_shuffle };
  }

  /**
   * シャッフル設定を切り替える
   * @returns 切替後の値 (0/1)。設定がない場合は null
   */
  async toggleShuffle(guildId: string, channelId: string): Promise<number | null> {
    const info = await this.musicInfoRepository.get(guildId, channelId);
    if (!info) {
      return null;
    }
    const next = info.is_shuffle === 0 ? 1 : 0;
    await this.musicInfoRepository.save({ guild_id: guildId, channel_id: channelId, is_shuffle: next });
    return next;
  }

  /**
   * ループ設定を切り替える
   * @returns 切替後の値 (0/1)。設定がない場合は null
   */
  async toggleLoop(guildId: string, channelId: string): Promise<number | null> {
    const info = await this.musicInfoRepository.get(guildId, channelId);
    if (!info) {
      return null;
    }
    const next = info.is_loop === 0 ? 1 : 0;
    await this.musicInfoRepository.save({ guild_id: guildId, channel_id: channelId, is_loop: next });
    return next;
  }

  /**
   * サイレント (再生通知の抑止) 設定を切り替える
   * @returns 切替後の値 (0/1)。設定がない場合は null
   */
  async toggleSilent(guildId: string, channelId: string): Promise<number | null> {
    const info = await this.musicInfoRepository.get(guildId, channelId);
    if (!info) {
      return null;
    }
    const next = info.silent ? 0 : 1;
    await this.musicInfoRepository.save({ guild_id: guildId, channel_id: channelId, silent: next });
    return next;
  }

  /**
   * 再生中の楽曲情報を保存する
   */
  async saveNowPlaying(guildId: string, channelId: string, track: MusicTrack): Promise<void> {
    await this.musicInfoRepository.save({
      guild_id: guildId,
      channel_id: channelId,
      title: track.title,
      url: track.url,
      thumbnail: track.thumbnail,
    });
  }

  /**
   * ユーザーの全プレイリストを取得する
   */
  async getPlaylists(userId: string): Promise<Models.Playlist[]> {
    return await this.playlistRepository.getAll(userId);
  }

  /**
   * プレイリストを名前で取得する
   */
  async getPlaylistByName(userId: string, name: string): Promise<Models.Playlist | null> {
    return await this.playlistRepository.get(userId, name);
  }

  /**
   * プレイリストを削除する
   */
  async removePlaylist(userId: string, name: string): Promise<boolean> {
    return await this.playlistRepository.remove(userId, name);
  }
}
