import { EmbedBuilder, Message } from 'discord.js';
import { Logger } from '../../../../common/logger.js';
import * as DotBotFunctions from '../../../dot_function/index.js';
import { getDefaultRoomName } from '../../../dot_function/voice.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class RoomHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    switch (command) {
      case 'room': {
        await this.handleRoom(message, args);
        break;
      }
      case 'rn': {
        await this.handleRoomName(message, args);
        break;
      }
      case 'team': {
        await this.handleTeam(message, args);
        break;
      }
      case 'custom': {
        await this.handleCustom(message, args);
        break;
      }
    }
  }

  private async handleRoom(message: Message, args: string[]): Promise<void> {
    const mode = args[0];
    const value = args[1];

    if (!mode) {
      return;
    }

    switch (mode) {
      case 'name': {
        args.shift();
        let roomName;
        if (!value) {
          // 初期名(お部屋: #NUM)に変更
          const guild = message.guild;
          if (!guild) {
            return;
          }
          roomName = getDefaultRoomName(message.guild);
        } else {
          roomName = args.join(' ');
        }
        await DotBotFunctions.Room.changeRoomName(message, roomName);
        break;
      }
      case 'limit': {
        if (!value || Number(value) <= 0) {
          await DotBotFunctions.Room.changeLimit(message, 0);
          return;
        }
        let limit = Number(value);
        if (limit > 99) {
          limit = 99;
        }
        await DotBotFunctions.Room.changeLimit(message, Number(value));
        break;
      }
      case 'delete':
      case 'lock': {
        await DotBotFunctions.Room.changeRoomSetting(message, 'delete');
        break;
      }
      case 'live': {
        let roomName;
        if (!value) {
          // 初期名(お部屋: #NUM)に変更
          const guild = message.guild;
          if (!guild) {
            return;
          }
          const vc = message.member?.voice.channel;
          if (!vc) {
            return;
          }
          roomName = vc.name;
        } else {
          roomName = value;
        }

        await DotBotFunctions.Room.changeRoomSetting(message, 'live', roomName);
        break;
      }
    }
  }

  private async handleRoomName(message: Message, args: string[]): Promise<void> {
    const value = args.join(' ');
    let roomName;
    if (!value) {
      // 初期名(お部屋: #NUM)に変更
      const guild = message.guild;
      if (!guild) {
        return;
      }
      roomName = getDefaultRoomName(message.guild);
    } else {
      roomName = value;
    }
    await DotBotFunctions.Room.changeRoomName(message, roomName);
  }

  private async handleTeam(message: Message, args: string[]): Promise<void> {
    if (args.length > 0) {
      const number = Number(args[0]);
      if (number < 1) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`1以上の数字を入れてね`);

        message.reply({ embeds: [send] });
        return;
      }
      await DotBotFunctions.Room.team(message, number, args[1] != undefined);
    }
  }

  private async handleCustom(message: Message, args: string[]): Promise<void> {
    const value = args[0];
    const team = Number(args[1]);
    const limit = Number(args[2]);
    if (!value) {
      return;
    }
    if (value === 'start') {
      await DotBotFunctions.Room.createTeamRoom(message, team, limit);
    }
    if (value === 'end') {
      await DotBotFunctions.Room.deleteTeamRoom(message, !!args[1]);
    }
  }
}