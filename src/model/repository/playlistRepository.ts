import { DeepPartial, Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { TypeOrm } from '../typeorm/typeorm.js';

export class PlaylistRepository {
  private repository: Repository<Models.Playlist>;

  constructor() {
    this.repository = TypeOrm.dataSource.getRepository(Models.Playlist);
  }

  /**
   * プレイリストを全件取得する
   * @param gid
   */
  public async getAll(userId: string): Promise<Models.Playlist[]> {
    return await this.repository.find({ where: { user_id: userId } });
  }

  /**
   * プレイリストを取得する
   * @param gid
   */
  public async get(userId: string, name: string): Promise<Models.Playlist | null> {
    return await this.repository.findOne({
      where: { user_id: userId, name: name },
    });
  }

  public async changeState(userId: string, name: string, change: 'shuffle' | 'loop', state: boolean): Promise<boolean> {
    const list = await this.repository.findOne({ where: { user_id: userId, name: name } });
    if (!list) {
      return false;
    }

    switch (change) {
      case 'shuffle': {
        await this.repository.update({ id: list.id }, { shuffle: state ? 1 : 0 });
        return true;
      }
      case 'loop': {
        await this.repository.update({ id: list.id }, { loop: state ? 1 : 0 });
        return true;
      }
      default: {
        return false;
      }
    }
  }

  /**
   * プレイリストを複数件保存する
   */
  public async saveAll(musics: DeepPartial<Models.Playlist[]>): Promise<Models.Playlist[]> {
    return await this.repository.save(musics);
  }

  /**
   * プレイリストを保存する
   */
  public async save(music: DeepPartial<Models.Playlist>): Promise<Models.Playlist[]> {
    return await this.repository.save([music]);
  }

  /**
   * プレイリストを削除する
   */
  public async remove(userId: string, name: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('user_id = :user_id', { user_id: userId })
      .where('name = :name', { name: name })
      .execute();
    return Boolean(result.affected);
  }
}
