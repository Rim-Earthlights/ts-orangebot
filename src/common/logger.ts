import dayjs from 'dayjs';

/**
 * ログを出力する
 * @param gid
 * @param event
 * @param message
 */
export async function info(gid: string | undefined, event: string, message?: string) {
    console.log(`[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/INFO]: ${gid} | ${event}`);
    if (message) {
        console.log('> ' + message);
    }
    console.log('==================================================');
}

/**
 * エラーログを出力する
 * @param gid
 * @param event
 * @param message
 */
export async function error(gid: string | undefined, event: string, message?: string) {
    console.log(`[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/ERROR]: ${gid} | ${event}`);
    if (message) {
        console.log('> ' + message);
    }
    console.log('==================================================');
}
