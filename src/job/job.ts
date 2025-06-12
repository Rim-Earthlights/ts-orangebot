import dayjs from 'dayjs';
import * as cron from 'node-cron';
import { Logger } from '../common/logger.js';
import { llmList } from '../constant/chat/chat.js';
import { UsersRepository } from '../model/repository/usersRepository.js';
import { LogLevel } from '../type/types.js';

export async function initJob() {
  /**
   * 毎日0時に実行されるタスク
   */
  cron.schedule('0 0 * * *', async () => {
    await Logger.put({
      guild_id: undefined,
      channel_id: undefined,
      user_id: undefined,
      level: LogLevel.INFO,
      event: 'Cron job: 0 0 * * *',
      message: undefined,
    });
    const user = new UsersRepository();
    await user.addPickLeft();
  });

  /**
   * 1分毎に実行されるタスク
   */
  cron.schedule('* * * * *', async () => {
    llmList.gpt.map(async (c) => {
      if (c.timestamp.isBefore(dayjs().subtract(1, 'hour')) && !c.memory) {
        llmList.gpt = llmList.gpt.filter((g) => g.id !== c.id);
        await Logger.put({
          guild_id: c.isGuild ? c.id : undefined,
          channel_id: c.isGuild ? undefined : c.id,
          user_id: undefined,
          level: LogLevel.INFO,
          event: 'Cron job: * * * * *',
          message: [`ChatGPT data deleted`],
        });
      }
    });
  });
  await Logger.put({
    guild_id: undefined,
    channel_id: undefined,
    user_id: undefined,
    level: LogLevel.INFO,
    event: 'Cron job',
    message: ['Initialized'],
  });
}
