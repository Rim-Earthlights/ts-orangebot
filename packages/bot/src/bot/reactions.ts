import {
  ChannelType,
  GuildMember,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  TextChannel,
  User,
} from 'discord.js';
import { Logger } from '../common/logger.js';
import { Users, UserSetting } from '../model/models';
import { RoleRepository } from '../model/repository/roleRepository.js';
import { UsersRepository } from '../model/repository/usersRepository.js';
import { LogLevel } from '../type/types.js';

/**
 * リアクション時の処理を行う
 * @param reaction
 * @param user
 * @returns
 */
export const reactionSelector = async (
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message:', error);
      return;
    }
  }

  if (user.partial) {
    try {
      await user.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message:', error);
      return;
    }
  }

  if (user.bot) return;

  const embed = reaction.message.embeds.find((e) => e.title);
  if (!embed) return;

  switch (embed.title) {
    case 'ルールを読んだ': {
      if (reaction.message.channel.type === ChannelType.GuildText) {
        await reaction.users.remove(user.id);

        if (!reaction.message.guild) {
          return;
        }
        // adminに送信
        const channel = (await reaction.message.guild.channels.fetch('1239718107073875978')) as TextChannel;
        if (!channel) {
          return;
        }
        await channel.send(`rule accepted: ${user.displayName}`);

        await Logger.put({
          guild_id: reaction.message.guild?.id,
          channel_id: reaction.message.channel.id,
          user_id: user.id,
          level: LogLevel.INFO,
          event: 'reaction-add',
          message: [`rule accepted: ${user.displayName}`],
        });

        const u = reaction.message.guild?.members.cache.get(user.id);

        if (!u) {
          console.error('user not found');
          return;
        }

        const roleRepository = new RoleRepository();

        // channelType is GuildText so guild is not null
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const r = await roleRepository.getRoleByName(reaction.message.guild!.id, 'member');
        if (!r) {
          console.error('role not found');
          return;
        }
        const userRole = u?.roles.cache.find((role) => role.id === r.role_id);

        await Logger.put({
          guild_id: reaction.message.guild?.id,
          channel_id: reaction.message.channel.id,
          user_id: user.id,
          level: LogLevel.INFO,
          event: 'role-check',
          message: [u?.roles.cache.map((role) => role.name).join(',')],
        });
        if (userRole) {
          const message = await reaction.message.reply(`もうロールが付いてるみたい！`);
          setTimeout(async () => {
            await message.delete();
          }, 3000);
          await registUser(reaction, user, u);
          return;
        }

        // add user role
        await u?.roles.add(r.role_id);
        await registUser(reaction, user, u);

        const message = await reaction.message.reply(`読んでくれてありがと～！ロールを付与したよ！`);
        setTimeout(async () => {
          await message.delete();
        }, 3000);
        return;
      }
      break;
    }
    case 'ゲームの選択': {
      if (reaction.message.channel.type === ChannelType.GuildText) {
        await reaction.users.remove(user.id);
        await Logger.put({
          guild_id: reaction.message.guild?.id,
          channel_id: reaction.message.channel.id,
          user_id: user.id,
          level: LogLevel.INFO,
          event: 'reaction-add',
          message: [`game selected: ${user.displayName} | ${reaction.emoji.name}`],
        });
      }
      break;
    }
  }
};

const registUser = async (
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  userCache: GuildMember
) => {
  // register user
  const userRepository = new UsersRepository();
  const userSetting = await userRepository.getUserSetting(user.id);
  if (!userSetting) {
    const saveUserSetting: Partial<UserSetting> = {
      user_id: user.id,
      nickname: user.displayName,
    };
    await userRepository.saveUserSetting(saveUserSetting);
  }

  const userEntity = await userRepository.get(reaction.message.guild!.id, user.id);
  if (!userEntity) {
    if (!reaction.message.guild) {
      return;
    }

    // ソフトデリートされたユーザーを検索
    const deletedUser = await userRepository.getWithDeleted(reaction.message.guild.id, user.id);
    if (deletedUser && deletedUser.deleted_at) {
      // ソフトデリートされたユーザーを復元
      await userRepository.restore(reaction.message.guild.id, user.id);
      await Logger.put({
        guild_id: reaction.message.guild.id,
        channel_id: reaction.message.channel.id,
        user_id: user.id,
        level: LogLevel.INFO,
        event: 'user-restored',
        message: [`user restored: ${user.displayName}`],
      });
    } else {
      // 新規ユーザーを作成
      const saveUser: Partial<Users> = {
        id: user.id,
        guild_id: reaction.message.guild.id,
        user_name: user.displayName,
        pick_left: 10,
        voice_channel_data: [
          {
            gid: reaction.message.guild.id,
            date: new Date(),
          },
        ],
      };
      await userRepository.save(saveUser);
    }
  }
  const name = userCache?.roles.cache.find((role) => role.name === 'member')?.name;
  await Logger.put({
    guild_id: reaction.message.guild?.id,
    channel_id: reaction.message.channel.id,
    user_id: user.id,
    level: LogLevel.INFO,
    event: 'add-role',
    message: name ? [name] : undefined,
  });
};
