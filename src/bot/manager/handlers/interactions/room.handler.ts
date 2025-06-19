import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import * as BotFunctions from '../../../function/index.js';

export class RoomHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const type = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });
    
    switch (type) {
      case 'create': {
        const name = interaction.options.getString('name');
        const isLive = interaction.options.getBoolean('live') ?? false;
        const isPrivate = interaction.options.getBoolean('private') ?? true;

        if (!name) {
          await interaction.editReply({ content: 'チャンネル名を指定してください' });
          return;
        }
        await BotFunctions.Room.createRoom(interaction, name, isLive, isPrivate);
        break;
      }
      case 'add': {
        const user = interaction.options.getUser('user');
        const member = interaction.guild?.members.cache.get(user?.id ?? '');
        if (!member) {
          await interaction.editReply({ content: 'ユーザーが見つかりません' });
          return;
        }
        await BotFunctions.Room.addPermission(interaction, member);
        break;
      }
      case 'remove': {
        const user = interaction.options.getUser('user');
        const member = interaction.guild?.members.cache.get(user?.id ?? '');
        if (!member) {
          await interaction.editReply({ content: 'ユーザーが見つかりません' });
          return;
        }
        await BotFunctions.Room.removePermission(interaction, member);
        break;
      }
      case 'lock': {
        await BotFunctions.Room.toggleAutoDelete(interaction);
        break;
      }
    }
  }
}