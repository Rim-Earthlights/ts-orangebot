import * as cron from 'node-cron';
import * as logger from '../common/logger.js';
import { UsersRepository } from '../model/repository/usersRepository.js';
import dayjs from 'dayjs';
import { GPT } from '../constant/chat/chat.js';

export async function initJob() {
    /**
     * 毎日0時に実行されるタスク
     */
    cron.schedule('0 0 * * *', async () => {
        await logger.put({
            guild_id: undefined,
            channel_id: undefined,
            user_id: undefined,
            level: 'system',
            event: 'Cron job: 0 0 * * *',
            message: undefined
        });
        const user = new UsersRepository();
        await user.addPickLeft();
    });

    /**
     * 1分毎に実行されるタスク
     */
    cron.schedule('* * * * *', async () => {
        GPT.chat.map(async (c) => {
            if (c.timestamp.isBefore(dayjs().subtract(10, 'minute'))) {
                c.timestamp = dayjs();
                c.parentMessageId = [];
                await logger.put({
                    guild_id: undefined,
                    channel_id: undefined,
                    user_id: undefined,
                    level: 'system',
                    event: 'Cron job: * * * * *',
                    message: `${c.guild}: ChatGPT data deleted`
                });
            }
        });
        GPT.chat = GPT.chat.filter((c) => c.parentMessageId.length !== 0);
    });
    await logger.put({
        guild_id: undefined,
        channel_id: undefined,
        user_id: undefined,
        level: 'system',
        event: 'Cron job',
        message: 'Initialized'
    });
}
