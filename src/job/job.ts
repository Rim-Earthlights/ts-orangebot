import * as cron from 'node-cron';
import { UsersRepository } from '../model/repository/usersRepository.js';
import dayjs from 'dayjs';
import { GPT, GPTType } from '../constant/chat/chat.js';
import { Logger } from '../common/logger.js';
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
            message: undefined
        });
        const user = new UsersRepository();
        await user.addPickLeft();
    });

    /**
     * 1分毎に実行されるタスク
     */
    cron.schedule('* * * * *', async () => {
        const today = dayjs().date();
        GPT.chat.map(async (c) => {
            if (c.type !== GPTType.GUILD) {
                if (today !== c.timestamp.date()) {
                    const id = c.id;
                    GPT.chat = GPT.chat.filter((chat) => chat.id !== c.id);
                    await Logger.put({
                        guild_id: id,
                        channel_id: undefined,
                        user_id: undefined,
                        level: LogLevel.INFO,
                        event: 'Cron job: * * * * *',
                        message: [`ChatGPT data deleted`]
                    });
                }
                return;
            }
            if (c.timestamp.isBefore(dayjs().subtract(10, 'minute'))) {
                const id = c.id;
                GPT.chat = GPT.chat.filter((chat) => chat.id !== c.id);
                await Logger.put({
                    guild_id: id,
                    channel_id: undefined,
                    user_id: undefined,
                    level: LogLevel.INFO,
                    event: 'Cron job: * * * * *',
                    message: [`ChatGPT data deleted`]
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
        message: ['Initialized']
    });
}
