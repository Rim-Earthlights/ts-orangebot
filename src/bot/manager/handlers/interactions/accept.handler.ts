import { CacheType, ChatInputCommandInteraction, ChannelType } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { LogLevel } from '../../../../type/types.js';
import { RoleRepository } from '../../../../model/repository/roleRepository.js';
import { UsersRepository } from '../../../../model/repository/usersRepository.js';
import { Users } from '../../../../model/models/users.js';

export class AcceptHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    if (!interaction.guild) {
      return;
    }
    if (interaction.channel?.type === ChannelType.GuildText) {
      const user = interaction.user;
      await Logger.put({
        guild_id: interaction.guild.id,
        channel_id: interaction.channel.id,
        user_id: user.id,
        level: LogLevel.INFO,
        event: 'reaction-add',
        message: [`rule accepted: ${user.displayName}`],
      });

      const u = interaction.guild.members.cache.get(user.id);

      if (!u) {
        console.error('user not found');
        return;
      }

      const roleRepository = new RoleRepository();

      const r = await roleRepository.getRoleByName(interaction.guild.id, 'member');
      if (!r) {
        console.error('role not found');
        return;
      }
      const userRole = u?.roles.cache.find((role) => role.id === r.role_id);

      await Logger.put({
        guild_id: interaction.guild.id,
        channel_id: interaction.channel.id,
        user_id: user.id,
        level: LogLevel.INFO,
        event: 'role-check',
        message: [u?.roles.cache.map((role) => role.name).join(',')],
      });
      if (userRole) {
        const message = await interaction.reply({ content: `もうロールが付いてるみたい！`, ephemeral: true });
        setTimeout(async () => {
          await message.delete();
        }, 3000);
        return;
      }

      // add user role
      await u?.roles.add(r.role_id);

      // register user
      const userRepository = new UsersRepository();
      const userEntity = await userRepository.get(interaction.guild.id, user.id);
      if (!userEntity) {
        const saveUser: Partial<Users> = {
          id: user.id,
          user_name: user.displayName,
          pick_left: 10,
          voice_channel_data: [
            {
              gid: interaction.guild.id ?? 'DM',
              date: new Date(),
            },
          ],
        };
        await userRepository.save(saveUser);
      }
      const name = u?.roles.cache.find((role) => role.name === 'member')?.name;
      await Logger.put({
        guild_id: interaction.guild.id,
        channel_id: interaction.channel.id,
        user_id: user.id,
        level: LogLevel.INFO,
        event: 'add-role',
        message: name ? [name] : undefined,
      });

      const message = await interaction.reply({
        content: `読んでくれてありがと～！ロールを付与したよ！`,
        ephemeral: true,
      });
      setTimeout(async () => {
        await message.delete();
      }, 3000);
      return;
    }
  }
}