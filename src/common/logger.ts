import dayjs from 'dayjs';
import { Log } from '../model/models';
import { DeepPartial } from 'typeorm';

/**
 * ログを出力する
 * @param gid
 * @param event
 * @param message
 */
export async function put(log: DeepPartial<Log>) {
    console.log(`[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/${log.level}]: ${log.guild_id} | ${log.event}`);
    if (log.message) {
        console.log('> ' + log.message);
    }
    console.log('==================================================');
}
