import { DeepPartial, Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { UsersType } from '../models/users.js';
import { TypeOrm } from '../typeorm/typeorm.js';

export class UsersRepository {
  private repository: Repository<Models.Users>;
  private userSettingRepository: Repository<Models.UserSetting>;

  constructor() {
    this.repository = TypeOrm.dataSource.getRepository(Models.Users);
    this.userSettingRepository = TypeOrm.dataSource.getRepository(Models.UserSetting);
  }

  /**
   * UIDからユーザを取得する.
   * @param gid guild.id
   * @param uid user.id
   * @returns Promise<Users | null>
   */
  public async get(gid: string, uid: string): Promise<Models.Users | null> {
    const user = await this.repository.findOne({ relations: { guild: true, userSetting: true }, where: { id: uid, guild_id: gid } });
    return user;
  }

  /**
   * ソフトデリートされたユーザーも含めて取得する.
   * @param gid guild.id
   * @param uid user.id
   * @returns Promise<Users | null>
   */
  public async getWithDeleted(gid: string, uid: string): Promise<Models.Users | null> {
    const user = await this.repository.findOne({
      relations: { guild: true, userSetting: true },
      where: { id: uid, guild_id: gid },
      withDeleted: true
    });
    return user;
  }

  /**
   * UIDからユーザを取得する.
   * @param uid user.id
   * @returns Promise<Users | null>
   */
  public async getByUid(uid: string): Promise<Models.Users | null> {
    const user = await this.repository.findOne({ relations: { userSetting: true }, where: { id: uid } });
    return user;
  }

  /**
   * すべてのユーザを取得する.
   * @param gid guild.id
   * @returns Promise<Users[]>
   */
  public async getAll(gid: string): Promise<Models.Users[]> {
    const user = await this.repository.find({ relations: { guild: true, userSetting: true }, where: { guild_id: gid } });
    return user;
  }

  /**
   * ユーザを登録・更新する
   * @param user
   * @returns
   */
  public async save(user: DeepPartial<Models.Users>): Promise<void> {
    await this.repository.save(user);
  }

  /**
   * ユーザー設定を取得する
   * @param uid user.id
   * @returns Promise<UserSetting | null>
   */
  public async getUserSetting(uid: string): Promise<Models.UserSetting | null> {
    const userSetting = await this.userSettingRepository.findOne({ where: { user_id: uid } });
    return userSetting;
  }

  /**
   * ユーザー設定を登録・更新する
   * @param userSetting
   */
  public async saveUserSetting(userSetting: DeepPartial<Models.UserSetting>): Promise<void> {
    await this.userSettingRepository.save(userSetting);
  }

  /**
   * ユーザを削除する
   * @param gid guild.id
   * @param uid user.id
   */
  public async delete(gid: string, uid: string): Promise<void> {
    await this.repository.softDelete({ id: uid, guild_id: gid });
  }

  /**
   * ソフトデリートされたユーザーを復元する
   * @param gid guild.id
   * @param uid user.id
   */
  public async restore(gid: string, uid: string): Promise<void> {
    await this.repository.restore({ id: uid, guild_id: gid });
  }

  /**
   * ユーザを完全に削除する
   * @param gid guild.id
   * @param uid user.id
   */
  public async hardDelete(gid: string, uid: string): Promise<void> {
    await this.repository.delete({ id: uid, guild_id: gid });
  }

  /**
   * ユーザーの権限を取得する
   * @param gid guild.id
   * @param uid user.id
   * @returns
   */
  public async getUsersType(gid: string, uid: string): Promise<UsersType | null> {
    const users = await this.repository.findOne({ where: { id: uid } });
    if (!users) {
      return null;
    }

    return users.type;
  }

  /**
   * ユーザーの権限を更新する
   * @param gid guild.id
   * @param uid user.id
   * @param type
   */
  public async updateUsersType(gid: string, uid: string, type: UsersType): Promise<Models.Users | null> {
    await this.repository.save({ id: uid, type, guild_id: gid });

    const user = this.get(gid, uid);
    return user;
  }

  /**
   * ガチャ回数をpickLeft回に再セットする
   * @param gid guild.id
   * @param uid user.id
   * @param pickLeft 再セットするピック数
   */
  public async resetGacha(gid: string, uid: string, pickLeft: number): Promise<void> {
    await this.repository.save({ id: uid, pick_left: pickLeft, guild_id: gid });
  }

  /**
   * ユーザの残りピック数を10増やす
   * @param gid guild.id
   */
  public async addPickLeft(): Promise<void> {
    const users = await this.repository.find();
    const saveUsers = users.map((u) => {
      if (u.pick_left < 30) {
        return { ...u, pick_left: u.pick_left + 10 };
      } else {
        return { ...u };
      }
    });
    await this.repository.save(saveUsers);
  }

  /**
   * 詫び石を配布する
   * @param gid guild.id
   * @param num 配布する詫び石の数
   */
  public async relief(gid: string, num: number): Promise<void> {
    const users = await this.repository.find({ where: { guild_id: gid } });
    const saveUsers = users.map((u) => {
      u.pick_left += num;
      return { ...u };
    });
    await this.repository.save(saveUsers);
  }
}
