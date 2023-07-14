import dayjs from 'dayjs';
import { Log } from '../model/models';
import { DeepPartial } from 'typeorm';
import { LogRepository } from '../model/repository/logRepository.js';

/**
 * ログを出力する
 * @param gid
 * @param event
 * @param message
 */
export async function put(log: DeepPartial<Log>) {
    const repository = new LogRepository();
    try {
        await repository.save({
            ...log,
            message: log.message ? log.message.trimStart().replaceAll('\n', '/') : undefined
        });
        console.log(`[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/${log.level}]: ${log.guild_id} | ${log.event}`);
        if (log.message) {
            console.log('> ' + log.message);
        }
        console.log('==================================================');
    } catch (e) {
        const err = e as Error;
        console.error(err.message);
    }
}
