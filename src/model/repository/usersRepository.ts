import { DeepPartial, Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { TypeOrm } from '../typeorm/typeorm.js';
import { UsersType } from '../models/users.js';

export class UsersRepository {
  private repository: Repository<Models.Users>;

  constructor() {
    this.repository = TypeOrm.dataSource.getRepository(Models.Users);
  }

  /**
   * UIDからユーザを取得する.
   * @param uid user.id
   * @returns Promise<Users | null>
   */
  public async get(uid: string): Promise<Models.Users | null> {
    const user = await this.repository.findOne({ where: { id: uid } });
    return user;
  }

  /**
   * すべてのユーザを取得する.
   * @returns Promise<Users[]>
   */
  public async getAll(): Promise<Models.Users[]> {
    const user = await this.repository.find();
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
   * ユーザーの権限を取得する
   * @param uid
   * @returns
   */
  public async getUsersType(uid: string): Promise<UsersType | null> {
    const users = await this.repository.findOne({ where: { id: uid } });
    if (!users) {
      return null;
    }

    return users.type;
  }

  /**
   * ユーザーの権限を更新する
   * @param uid
   * @param type
   */
  public async updateUsersType(uid: string, type: UsersType): Promise<Models.Users | null> {
    await this.repository.save({ id: uid, type });

    const user = this.get(uid);
    return user;
  }

  /**
   * ガチャ回数をpickLeft回に再セットする
   * @param uid user id
   * @param pickLeft 再セットするピック数
   */
  public async resetGacha(uid: string, pickLeft: number): Promise<void> {
    await this.repository.save({ id: uid, pick_left: pickLeft });
  }

  /**
   * ユーザの残りピック数を10増やす
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
   */
  public async relief(num: number): Promise<void> {
    const users = await this.repository.find();
    const saveUsers = users.map((u) => {
      u.pick_left += num;
      return { ...u };
    });
    await this.repository.save(saveUsers);
  }
}
