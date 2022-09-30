import dayjs from 'dayjs';
import { Message } from 'discord.js';
import { getRndNumber } from '../common/common';
import * as GREETING from '../constant/words/greeting';

/**
 * おはよう の返答
 * @param message
 * @returns
 */
export async function morning(message: Message): Promise<void> {
    message.reply(await getWord(GREETING.morning));
}

/**
 * こんにちは の返答
 * @param message
 * @returns
 */
export async function hello(message: Message): Promise<void> {
    message.reply(await getWord(GREETING.noon));
}

/**
 * こんばんは の返答
 * @param message
 * @returns
 */
export async function evening(message: Message): Promise<void> {
    message.reply(await getWord(GREETING.evening));
}

/**
 * おやすみなさい の返答
 * @param message
 * @returns
 */
export async function goodNight(message: Message): Promise<void> {
    message.reply(await getWord(GREETING.sleep));
}

/**
 * 時間帯によって返答を返す
 * @param hour 時間
 * @param word
 * @returns
 */
async function getWord(word: GREETING.Word): Promise<string> {
    const hour = getHour();
    if (hour >= 19 || hour === 0) {
        // 19:00 - 0:59
        const num = getRndNumber(0, word.night.length - 1);
        return word.night[num];
    } else if (hour < 5) {
        // 1:00 - 4:59
        const num = getRndNumber(0, word.midnight.length - 1);
        return word.midnight[num];
    } else if (hour < 11) {
        // 5:00 - 10:59
        const num = getRndNumber(0, word.morning.length - 1);
        return word.morning[num];
    } else if (hour < 17) {
        // 11:00 - 16:59
        const num = getRndNumber(0, word.noon.length - 1);
        return word.noon[num];
    } else if (hour < 19) {
        // 17:00 - 18:59
        const num = getRndNumber(0, word.evening.length - 1);
        return word.evening[num];
    }
    return 'ごめんなさい、わからなかった……';
}

/**
 * 現在の時間を取得する
 * @returns
 */
function getHour(): number {
    return Number(dayjs().format('HH'));
}
