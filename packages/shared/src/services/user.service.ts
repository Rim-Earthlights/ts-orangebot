import * as Models from '../models/index.js';
import { UsersType } from '../models/users.js';
import { UsersRepository } from '../repository/usersRepository.js';
import { UserDto, UserRegisterRequest } from '../types/user.js';

/** ユニットテストでリポジトリをモックできるよう、利用メソッドのみを依存として宣言する */
type UsersRepositoryLike = Pick<
  UsersRepository,
  'get' | 'save' | 'delete' | 'restore' | 'getUsersType' | 'updateUsersType' | 'resetGacha'
>;

function toUserDto(user: Models.Users): UserDto {
  return {
    id: user.id,
    guildId: user.guild_id,
    userName: user.user_name,
    type: user.type,
    pickLeft: user.pick_left,
    lastPickDate: user.last_pick_date,
    voiceChannelData: user.voice_channel_data,
  };
}

/**
 * ユーザー管理サービス (Discord 非依存)
 */
export class UserService {
  constructor(private readonly usersRepository: UsersRepositoryLike = new UsersRepository()) {}

  /**
   * ユーザーを取得する
   */
  async getUser(guildId: string, userId: string): Promise<UserDto | null> {
    const user = await this.usersRepository.get(guildId, userId);
    return user ? toUserDto(user) : null;
  }

  /**
   * ユーザーを登録・更新する
   */
  async registerUser(request: UserRegisterRequest): Promise<void> {
    await this.usersRepository.save({
      id: request.userId,
      guild_id: request.guildId,
      user_name: request.userName,
      pick_left: request.pickLeft,
      voice_channel_data: request.voiceChannelData,
    });
  }

  /**
   * ユーザーの権限をチェックする
   * @param guildId サーバーID
   * @param userId ユーザーID
   * @param type 権限
   * @returns 権限があるかどうか (OWNER は常に true)
   */
  async hasUserType(guildId: string, userId: string, type: UsersType): Promise<boolean> {
    const userType = await this.usersRepository.getUsersType(guildId, userId);

    if (!userType) {
      return false;
    }
    if (type === userType || userType === UsersType.OWNER) {
      return true;
    }
    return false;
  }

  /**
   * ユーザーの権限を更新する
   */
  async updateUserType(guildId: string, userId: string, type: UsersType): Promise<UserDto | null> {
    const user = await this.usersRepository.updateUsersType(guildId, userId, type);
    return user ? toUserDto(user) : null;
  }

  /**
   * ガチャ回数を再セットする
   * @returns 再セット後のユーザー情報。ユーザー未登録の場合は null
   */
  async resetGachaCount(guildId: string, userId: string, count = 10): Promise<UserDto | null> {
    const user = await this.usersRepository.get(guildId, userId);
    if (!user) {
      return null;
    }
    await this.usersRepository.resetGacha(guildId, userId, count);
    return toUserDto({ ...user, pick_left: count } as Models.Users);
  }

  /**
   * ユーザーを削除する (ソフトデリート)
   * @returns 削除した場合 true、未登録の場合 false
   */
  async deleteUser(guildId: string, userId: string): Promise<boolean> {
    const user = await this.usersRepository.get(guildId, userId);
    if (!user) {
      return false;
    }
    await this.usersRepository.delete(guildId, userId);
    return true;
  }

  /**
   * ソフトデリートされたユーザーを復元する
   */
  async restoreUser(guildId: string, userId: string): Promise<void> {
    await this.usersRepository.restore(guildId, userId);
  }
}
