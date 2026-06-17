import * as cron from 'node-cron';
import { Logger } from '../common/logger.js';
import { createChatService } from '../bot/adapters/chat.adapter.js';
import { LogLevel } from "@orangebot/shared";
import { UserJob } from './user.job.js';

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
    await new UserJob().execute();
  });

  /**
   * 1分毎に実行されるタスク
   */
  cron.schedule('* * * * *', async () => {
    const expired = createChatService().pruneIdleSessions(60 * 60 * 1000);
    await Promise.all(
      expired.map(async (c) => {
        await Logger.put({
          guild_id: c.isGuild ? c.id : undefined,
          channel_id: c.isGuild ? undefined : c.id,
          user_id: undefined,
          level: LogLevel.INFO,
          event: 'Cron job: * * * * *',
          message: [`ChatGPT data deleted`],
        });
      })
    );
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
