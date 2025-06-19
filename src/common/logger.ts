import dayjs from 'dayjs';
import { LogRepository } from '../model/repository/logRepository.js';
import { LogData, LogLevel } from '../type/types';
import { GuildRepository } from '../model/repository/guildRepository.js';
import { CONFIG } from '../config/config.js';

export class Logger {
  private logRepository: LogRepository;
  private guildRepository: GuildRepository;

  constructor() {
    this.logRepository = new LogRepository();
    this.guildRepository = new GuildRepository();
  }

  /**
   * @deprecated Use instance methods (info, error, system, debug) instead
   */
  static async put(logData: LogData) {
    const logRepository = new LogRepository();
    const guildRepository = new GuildRepository();
    try {
      await logRepository.save({
        ...logData,
        bot_id: CONFIG.DISCORD.APP_ID,
        message: logData.message ? logData.message.join('\n') : '',
      });
      if (logData.guild_id) {
        const guild = await guildRepository.get(logData.guild_id);
        console.log(`[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/${logData.level}]: ${guild?.name} | ${logData.event}`);
      } else {
        console.log(
          `[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/${logData.level}]: ${logData.guild_id} | ${logData.event}`
        );
      }
      if (logData.message) {
        console.log(logData.message.join('\n'));
      }
      console.log('==================================================');
    } catch (e) {
      const err = e as Error;
      console.error(err.message);
    }
  }

  private async log(level: LogLevel, event: string, message?: string[], guild_id?: string, channel_id?: string, user_id?: string) {
    const logData: LogData = {
      guild_id,
      channel_id,
      user_id,
      level,
      event,
      message,
    };

    try {
      await this.logRepository.save({
        ...logData,
        bot_id: CONFIG.DISCORD.APP_ID,
        message: logData.message ? logData.message.join('\n') : '',
      });
      
      if (logData.guild_id) {
        const guild = await this.guildRepository.get(logData.guild_id);
        console.log(`[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/${logData.level}]: ${guild?.name} | ${logData.event}`);
      } else {
        console.log(
          `[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/${logData.level}]: ${logData.guild_id} | ${logData.event}`
        );
      }
      if (logData.message) {
        console.log(logData.message.join('\n'));
      }
      console.log('==================================================');
    } catch (e) {
      const err = e as Error;
      console.error(err.message);
    }
  }

  async info(event: string, message?: string[], guild_id?: string, channel_id?: string, user_id?: string) {
    await this.log(LogLevel.INFO, event, message, guild_id, channel_id, user_id);
  }

  async error(event: string, message?: string[], guild_id?: string, channel_id?: string, user_id?: string) {
    await this.log(LogLevel.ERROR, event, message, guild_id, channel_id, user_id);
  }

  async system(event: string, message?: string[], guild_id?: string, channel_id?: string, user_id?: string) {
    await this.log(LogLevel.SYSTEM, event, message, guild_id, channel_id, user_id);
  }

  async debug(event: string, message?: string[], guild_id?: string, channel_id?: string, user_id?: string) {
    await this.log(LogLevel.DEBUG, event, message, guild_id, channel_id, user_id);
  }
}
