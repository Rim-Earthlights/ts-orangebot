import { UsersType, VoiceChannelData } from '../models/users.js';

/**
 * ユーザー情報の DTO (Discord 非依存)
 */
export interface UserDto {
  id: string;
  guildId: string;
  userName: string | null;
  type: UsersType;
  pickLeft: number;
  lastPickDate: Date | null;
  voiceChannelData: VoiceChannelData[] | null;
}

/**
 * ユーザー登録・更新のリクエスト
 */
export interface UserRegisterRequest {
  guildId: string;
  userId: string;
  userName?: string;
  pickLeft?: number;
  voiceChannelData?: VoiceChannelData[];
}
