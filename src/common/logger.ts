import dayjs from 'dayjs';
import { CONFIG } from '../config/config.js';
import * as Models from '../model/models/index.js';
import { GuildRepository } from '../model/repository/guildRepository.js';
import { LogRepository } from '../model/repository/logRepository.js';
import { LogData, LogLevel } from '../type/types';

/**
 * @summary ログ記録と表示を管理するクラス
 */
export class Logger {
  private guildId: string | null;
  private channelId: string | null;
  private userId: string | null;
  private context: string;
  private guildRepository: GuildRepository;
  private logRepository: LogRepository;

  /**
   * @summary ロガーインスタンスを初期化する
   */
  constructor(guildId: string | null, channelId: string | null, userId: string | null, context: string) {
    this.guildId = guildId;
    this.channelId = channelId;
    this.userId = userId;
    this.context = context;
    this.logRepository = new LogRepository();
    this.guildRepository = new GuildRepository();
  }

  /**
   * @summary デバッグレベルのログを記録する
   */
  async debug(message: string[]) {
    const logData = this.createLogData(LogLevel.DEBUG, message);
    await this.logRepository.save(logData);
    this.print(logData);
  }

  /**
   * @summary 情報レベルのログを記録する
   */
  async info(message: string[]) {
    const logData = this.createLogData(LogLevel.INFO, message);
    await this.logRepository.save(logData);
    this.print(logData);
  }

  /**
   * @summary エラーレベルのログを記録する
   */
  async error(message: string[]) {
    const logData = this.createLogData(LogLevel.ERROR, message);
    await this.logRepository.save(logData);
    this.print(logData);
  }

  /**
   * @summary システムレベルのログを記録する
   */
  async system(message: string[]) {
    const logData = this.createLogData(LogLevel.SYSTEM, message);
    await this.logRepository.save(logData);
    this.print(logData);
  }

  /**
   * @summary ログデータをコンソールに出力する
   */
  async print(logData: Partial<Models.Log>) {
    if (logData.guild_id) {
      const guild = await this.guildRepository.get(logData.guild_id);
      console.log(`[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/${logData.level}]: ${guild?.name} | ${logData.event}`);
    } else {
      console.log(
        `[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/${logData.level}]: ${logData.guild_id} | ${logData.event}`
      );
    }
    if (logData.message) {
      console.log(logData.message);
    }
    console.log('==================================================');
  }

  /**
   * @summary ログデータオブジェクトを作成する
   */
  createLogData(logLevel: LogLevel, message: string[]): Partial<Models.Log> {
    const logData: LogData = {
      guild_id: this.guildId ?? undefined,
      channel_id: this.channelId ?? undefined,
      user_id: this.userId ?? undefined,
      level: logLevel,
      event: this.context,
      message: message,
    };
    return {
      ...logData,
      bot_id: CONFIG.DISCORD.APP_ID,
      message: logData.message ? logData.message.join('\n') : '',
    };
  }

  /**
   * @summary 静的メソッドでログを記録する
   * @deprecated 互換性のため一時残し
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
}
