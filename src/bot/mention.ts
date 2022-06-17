import dayjs from 'dayjs';
import { Message } from 'discord.js';
import { getRndNumber } from '../common/common';
import * as GREETING from '../constant/words/greeting';

/**
 * おはよう の返答
 * @param message
 * @returns
 */
export async function morning(message: Message) {
    let result;
    const hour = getHour();

    if (hour >= 5 && hour < 11) {
        // 5:00 - 10:59
        const num = getRndNumber(0, GREETING.morning.morning.length - 1);
        result = GREETING.morning.morning[num];
    } else if (hour < 17) {
        // 11:00 - 16:59
        const num = getRndNumber(0, GREETING.morning.noon.length - 1);
        result = GREETING.morning.noon[num];
    } else if (hour < 19) {
        // 17:00 - 18:59
        const num = getRndNumber(0, GREETING.morning.evening.length - 1);
        result = GREETING.morning.evening[num];
    } else if (hour >= 19 || hour < 5) {
        // 19:00 - 4:59
        const num = getRndNumber(0, GREETING.morning.night.length - 1);
        result = GREETING.morning.night[num];
    }

    message.reply(result ? result : '');
    return;
}

/**
 * おやすみなさい の返答
 * @param message
 * @returns
 */
export async function goodNight(message: Message) {
    const hour = getHour();

    if (hour >= 19 || hour === 0) {
        // 19:00 - 0:59
        message.reply('おやすみなさーい！明日もいっぱい遊ぼうね！');
    } else if (hour < 5) {
        // 1:00 - 4:59
        message.reply('すや……すや……おやすみなさい……');
    } else if (hour < 11) {
        // 5:00 - 10:59
        message.reply('え、私起きたところなんだけど…！？');
    } else if (hour < 17) {
        // 11:00 - 16:59
        message.reply('お昼寝するの！あんまり寝すぎないようにね～！');
    } else if (hour < 19) {
        // 17:00 - 18:59
        message.reply('疲れちゃった？ちゃんと目覚まし合わせた～？');
    }
    return;
}

/**
 * 現在の時間を取得する
 * @returns
 */
function getHour(): number {
    return Number(dayjs().format('HH'));
}
