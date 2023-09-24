import dayjs from 'dayjs';
import { LogRepository } from '../model/repository/logRepository.js';
import { LogData } from '../type/types';

export class Logger {
    static async put(logData: LogData) {
        const repository = new LogRepository();
        try {
            await repository.save({
                ...logData,
                message: logData.message ? logData.message.join('\n') : ''
            });
            console.log(
                `[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/${logData.level}]: ${logData.guild_id} | ${logData.event}`
            );
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
