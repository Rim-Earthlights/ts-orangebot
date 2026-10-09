import { GuildMember } from 'discord.js';
import { Logger } from '../../common/logger.js';
import { LogLevel, RoleRepository, Users, UserSetting, UsersRepository } from '@orangebot/shared';

/**
 * ルール同意処理の結果
 * - role-not-found: DB に member ロールが登録されていない
 * - already-member: 既に member ロールが付いていた (DB 登録のみ実施)
 * - role-added: member ロールを付与した
 */
export type AcceptMemberResult = 'role-not-found' | 'already-member' | 'role-added';

/**
 * ルール同意を処理する
 * member ロールを付与し、ユーザーを DB に登録する (ソフトデリート済みなら復元)
 * ルール同意リアクションと /accept の共通処理
 * @param member 対象ユーザー
 * @param channelId ログ用のチャンネルID
 * @returns 処理結果
 */
export async function acceptMember(member: GuildMember, channelId: string): Promise<AcceptMemberResult> {
  const guildId = member.guild.id;

  const roleRepository = new RoleRepository();
  const r = await roleRepository.getRoleByName(guildId, 'member');
  if (!r) {
    console.error('role not found');
    return 'role-not-found';
  }
  const userRole = member.roles.cache.find((role) => role.id === r.role_id);

  await Logger.put({
    guild_id: guildId,
    channel_id: channelId,
    user_id: member.id,
    level: LogLevel.INFO,
    event: 'role-check',
    message: [member.roles.cache.map((role) => role.name).join(',')],
  });

  if (!userRole) {
    // add user role
    await member.roles.add(r.role_id);
  }
  await registUser(member, channelId);

  return userRole ? 'already-member' : 'role-added';
}

/**
 * ユーザーを DB に登録する
 * @param member 対象ユーザー
 * @param channelId ログ用のチャンネルID
 */
const registUser = async (member: GuildMember, channelId: string) => {
  const guildId = member.guild.id;
  const user = member.user;

  const userRepository = new UsersRepository();
  const userSetting = await userRepository.getUserSetting(user.id);
  if (!userSetting) {
    const saveUserSetting: Partial<UserSetting> = {
      user_id: user.id,
    };
    await userRepository.saveUserSetting(saveUserSetting);
  }

  const userEntity = await userRepository.get(guildId, user.id);
  if (!userEntity) {
    // ソフトデリートされたユーザーを検索
    const deletedUser = await userRepository.getWithDeleted(guildId, user.id);
    if (deletedUser && deletedUser.deleted_at) {
      // ソフトデリートされたユーザーを復元
      await userRepository.restore(guildId, user.id);
      await Logger.put({
        guild_id: guildId,
        channel_id: channelId,
        user_id: user.id,
        level: LogLevel.INFO,
        event: 'user-restored',
        message: [`user restored: ${user.displayName}`],
      });
    } else {
      // 新規ユーザーを作成
      const saveUser: Partial<Users> = {
        id: user.id,
        guild_id: guildId,
        user_name: user.displayName,
        pick_left: 10,
        voice_channel_data: [
          {
            gid: guildId,
            date: new Date(),
          },
        ],
      };
      await userRepository.save(saveUser);
    }
  }
  const name = member.roles.cache.find((role) => role.name === 'member')?.name;
  await Logger.put({
    guild_id: guildId,
    channel_id: channelId,
    user_id: user.id,
    level: LogLevel.INFO,
    event: 'add-role',
    message: name ? [name] : undefined,
  });
};
