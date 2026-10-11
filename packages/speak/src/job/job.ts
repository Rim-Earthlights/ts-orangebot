import dayjs from 'dayjs';
import * as cron from 'node-cron';
import { LogLevel, withErrorLog } from '@orangebot/shared';
import { llmList } from '../bot/service/chatService.js';
import { Logger } from '../common/logger.js';

export async function initJob() {
  /**
   * 1分毎に実行されるタスク
   */
  cron.schedule(
    '* * * * *',
    withErrorLog('cron-minutely', async () => {
      const expired = llmList.llm.filter((c) => c.timestamp.isBefore(dayjs().subtract(30, 'minute')));
      const expiredIds = new Set(expired.map((c) => c.id));
      llmList.llm = llmList.llm.filter((c) => !expiredIds.has(c.id));
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
    })
  );

  await Logger.put({
    guild_id: undefined,
    channel_id: undefined,
    user_id: undefined,
    level: LogLevel.SYSTEM,
    event: 'Cron job',
    message: ['Initialized'],
  });
}

/**
 * 登録した定時バッチ処理をすべて止める (終了処理で使う)
 */
export async function stopJobs() {
  await Promise.all([...cron.getTasks().values()].map((task) => task.stop()));
}
