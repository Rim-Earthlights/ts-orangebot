import * as cron from 'node-cron';
import * as logger from '../common/logger.js';
import { UsersRepository } from '../model/repository/usersRepository.js';
import dayjs from 'dayjs';
import { GPT } from '../bot/function/chat.js';

export async function initJob() {
    /**
     * 毎日0時に実行されるタスク
     */
    cron.schedule('0 0 * * *', async () => {
        logger.info('system', 'Cron job: 0 0 * * *');
        const user = new UsersRepository();
        await user.addPickLeft();
    });

    /**
     * 1分毎に実行されるタスク
     */
    cron.schedule('* * * * *', async () => {
        GPT.chat.map((c) => {
            if (c.timestamp.isBefore(dayjs().subtract(10, 'minute'))) {
                c.timestamp = dayjs();
                c.parentMessageId = undefined;
                logger.info('system', 'Cron job: * * * * *', `${c.guild}: ChatGPT data deleted`);
            }
        });
    });

    logger.info('system', 'Cron job', 'Initialized');
}
