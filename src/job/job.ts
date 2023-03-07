import * as cron from 'node-cron';
import * as logger from '../common/logger';
import { UsersRepository } from '../model/repository/usersRepository';
import { AI } from '../bot/commands';
import dayjs from 'dayjs';

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
     * 10分毎に実行されるタスク
     */
    cron.schedule('*/10 * * * *', async () => {
        logger.info('system', 'Cron job: */10 * * * *');
        AI.chat = AI.chat.filter((c) => dayjs(c.timestamp) > dayjs().add(-10, 'minute'));
    });

    logger.info('system', 'Cron job', 'Initialized');
}
