import { CacheType, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import * as BotFunctions from '../../../function/index.js';

export class RoomHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const { commandName } = interaction;
    switch (commandName) {
      case 'room': {
        await this.handleRoomInteraction(interaction);
        break;
      }
      case 'rn': {
        await this.handleRoomNameInteraction(interaction);
        break;
      }
    }
  }

  /**
   * roomコマンドのハンドル
   */
  private async handleRoomInteraction(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const type = interaction.options.getSubcommand();

    switch (type) {
      case 'create': {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
      case 'name': {
        await interaction.deferReply();
        const name = interaction.options.getString('name');
        if (!name) {
          await interaction.editReply({ content: 'チャンネル名を指定してください' });
          return;
        }
        await BotFunctions.Room.changeRoomName(interaction, name);
        break;
      }
      case 'live': {
        await interaction.deferReply();
        await BotFunctions.Room.toggleLive(interaction);
        break;
      }
      case 'add': {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const user = interaction.options.getUser('user');
        const member = interaction.guild?.members.cache.get(user?.id ?? '');
        if (!member) {
          await interaction.editReply({ content: 'ユーザーが見つかりません' });
          return;
        }
        await BotFunctions.Room.removePermission(interaction, member);
        break;
      }
      case 'limit': {
        await interaction.deferReply();
        const limit = interaction.options.getNumber('limit') ?? 99;
        await BotFunctions.Room.setLimit(interaction, limit);
      }
      case 'lock': {
        await interaction.deferReply();
        await BotFunctions.Room.toggleAutoDelete(interaction);
        break;
      }
    }
  }

  /**
   * rnコマンドのハンドル
   */
  private async handleRoomNameInteraction(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();
    const name = interaction.options.getString('name');
    if (!name) {
      await interaction.editReply({ content: 'チャンネル名を指定してください' });
      return;
    }
    await BotFunctions.Room.changeRoomName(interaction, name);
  }
}
