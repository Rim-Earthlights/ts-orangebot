import { getRndArray } from '../common/random.js';
import * as Models from '../models/index.js';
import { RoomRepository } from '../repository/roomRepository.js';

/** ユニットテストでリポジトリをモックできるよう、利用メソッドのみを依存として宣言する */
type RoomRepositoryLike = Pick<
  RoomRepository,
  'getRoom' | 'createRoom' | 'updateRoom' | 'deleteRoom' | 'getAutodeleteRooms'
>;

/**
 * チーム分け結果
 */
export interface TeamMember {
  team: number;
  id: string;
  name: string | undefined;
}

/**
 * ルーム管理サービス (Discord 非依存)
 */
export class RoomService {
  constructor(private readonly roomRepository: RoomRepositoryLike = new RoomRepository()) {}

  /**
   * ルーム情報を取得する
   */
  async getRoom(roomId: string): Promise<Models.Room | null> {
    return await this.roomRepository.getRoom(roomId);
  }

  /**
   * ルームを登録する
   */
  async registerRoom(room: {
    roomId: string;
    guildId: string;
    name: string;
    isAutodelete: boolean;
    isLive: boolean;
    isPrivate: boolean;
  }): Promise<void> {
    await this.roomRepository.createRoom({
      room_id: room.roomId,
      guild_id: room.guildId,
      name: room.name,
      is_autodelete: room.isAutodelete,
      is_live: room.isLive,
      is_private: room.isPrivate,
    });
  }

  /**
   * ルームの登録を解除する
   */
  async unregisterRoom(roomId: string): Promise<boolean> {
    return await this.roomRepository.deleteRoom(roomId);
  }

  /**
   * ルーム名を変更する
   * @returns 更新後のルーム情報 (is_live は変更前の値を保持)。未登録の場合は null
   */
  async renameRoom(roomId: string, name: string): Promise<Models.Room | null> {
    const room = await this.roomRepository.getRoom(roomId);
    if (!room) {
      return null;
    }
    await this.roomRepository.updateRoom(roomId, { name });
    room.name = name;
    return room;
  }

  /**
   * 自動削除フラグを切り替える
   * @returns 切替後の状態。未登録の場合は null
   */
  async toggleAutoDelete(roomId: string): Promise<boolean | null> {
    const room = await this.roomRepository.getRoom(roomId);
    if (!room) {
      return null;
    }
    room.is_autodelete = !room.is_autodelete;
    await this.roomRepository.updateRoom(roomId, room);
    return room.is_autodelete;
  }

  /**
   * 配信フラグを切り替える
   * @param baseName 指定時はルーム名をこの値 ([L] プレフィックスは除去) に更新する
   * @returns 切替後のルーム情報。未登録の場合は null
   */
  async toggleLive(roomId: string, baseName?: string): Promise<Models.Room | null> {
    const room = await this.roomRepository.getRoom(roomId);
    if (!room) {
      return null;
    }
    room.is_live = !room.is_live;
    if (baseName != undefined) {
      room.name = baseName.replace('[L] ', '');
    }
    await this.roomRepository.updateRoom(roomId, room);
    return room;
  }

  /**
   * 自動削除対象のルーム一覧を取得する
   */
  async getAutodeleteRooms(guildId: string): Promise<Models.Room[]> {
    return await this.roomRepository.getAutodeleteRooms(guildId);
  }

  /**
   * メンバーをランダムにチーム分けする (純粋ロジック)
   * @param members メンバー一覧
   * @param teamCount チーム数
   */
  static splitTeams(members: { id: string; name?: string }[], teamCount: number): TeamMember[] {
    const ids = members.map((m) => m.id);
    const rnd = getRndArray(ids.length);
    const shuffled = ids.map((_, i) => ids[rnd[i]]);

    const teams: TeamMember[] = [];
    for (let i = 0; i < shuffled.length; i++) {
      teams.push({
        team: i % teamCount,
        id: shuffled[i],
        name: members.find((m) => m.id === shuffled[i])?.name,
      });
    }
    return teams;
  }
}
