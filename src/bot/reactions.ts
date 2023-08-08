import { ChannelType, MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { CONFIG } from '../config/config.js';
import { Logger } from '../common/logger.js';
import { UsersRepository } from '../model/repository/usersRepository.js';
import { Users } from '../model/models';
import { RoleRepository } from '../model/repository/roleRepository.js';

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
                await Logger.put({
                    guild_id: reaction.message.guild?.id,
                    channel_id: reaction.message.channel.id,
                    user_id: user.id,
                    level: 'info',
                    event: 'reaction-add',
                    message: `rule accepted: ${user.username}`
                });

                const u = reaction.message.guild?.members.cache.get(user.id);

                if (!u) {
                    console.error('user not found');
                    return;
                }

                const roleRepository = new RoleRepository();
                const r = await roleRepository.getRoleByName('member');
                if (!r) {
                    console.error('role not found');
                    return;
                }
                const userRole = u?.roles.cache.find((role) => role.id === r.role_id);

                await Logger.put({
                    guild_id: reaction.message.guild?.id,
                    channel_id: reaction.message.channel.id,
                    user_id: user.id,
                    level: 'info',
                    event: 'role-check',
                    message: u?.roles.cache.map((role) => role.name).join(',')
                });
                if (userRole) {
                    const message = await reaction.message.reply(`もうロールが付いてるみたい！`);
                    setTimeout(async () => {
                        await message.delete();
                    }, 3000);
                    return;
                }

                // add user role
                await u?.roles.add(r.role_id);

                // register user
                const userRepository = new UsersRepository();
                const userEntity = await userRepository.get(user.id);
                if (!userEntity) {
                    const saveUser: Partial<Users> = {
                        id: user.id,
                        user_name: user.username
                    };
                    await userRepository.save(saveUser);
                }

                await Logger.put({
                    guild_id: reaction.message.guild?.id,
                    channel_id: reaction.message.channel.id,
                    user_id: user.id,
                    level: 'info',
                    event: 'add-role',
                    message: u?.roles.cache.find((role) => role.name === 'member')?.name
                });

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
                    level: 'info',
                    event: 'reaction-add',
                    message: `game selected: ${user.username} | ${reaction.emoji.name}`
                });
            }
            break;
        }
    }
};
