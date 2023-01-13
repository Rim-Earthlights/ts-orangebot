import * as cron from 'node-cron';
import * as logger from '../common/logger';
import { UsersRepository } from '../model/repository/usersRepository';

export async function initJob() {
    /**
     * 毎日0時に実行されるタスク
     */
    cron.schedule('0 0 * * *', async () => {
        logger.info(undefined, 'Cron job: 0 0 * * *');
        const user = new UsersRepository();
        await user.addPickLeft();
    });
    logger.info(undefined, 'Cron job', 'Initialized');
}
