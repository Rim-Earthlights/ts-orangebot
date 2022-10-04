import { Message } from 'discord.js';
import * as Commands from './commands';
import * as BotFunctions from './function';

/**
 * 反応ワードから処理を実行する
 * @param message 渡されたメッセージ
 * @returns
 */
export async function wordSelector(message: Message) {
    if (message.content.match('(言語は|ヘルプ|help)')) {
        Commands.help(message);
        return;
    }
    if (message.content.match('おはよ')) {
        BotFunctions.Mention.morning(message);
        return;
    }
    if (message.content.match('(こんにちは|こんにちわ)')) {
        BotFunctions.Mention.hello(message);
        return;
    }
    if (message.content.match('(こんばんは|こんばんわ)')) {
        BotFunctions.Mention.evening(message);
        return;
    }
    if (message.content.match('(おやすみ|寝るね|ねるね)')) {
        BotFunctions.Mention.goodNight(message);
        return;
    }
    if (message.content.match('ガチャ')) {
        await Commands.gacha(message);
    }
    if (message.content.match('(かわい|かわよ|可愛い)')) {
        message.reply('えへへ～！ありがと嬉しい～！');
        return;
    }
    if (message.content.match('(癒して|癒やして|いやして)')) {
        message.reply('どしたの…？よしよし……');
        return;
    }
    if (message.content.match('(運勢|みくじ)')) {
        Commands.luck(message);
        return;
    }
    if (message.content.match('(天気|てんき)')) {
        const cityName = await BotFunctions.Forecast.getPref(message.author.id);
        if (!cityName) {
            message.reply('地域が登録されてないよ！\n@みかんちゃん 地域覚えて [地域]  で登録して！');
            return;
        }
        const when = message.content.match(/今日|明日|\d日後/);
        let day = 0;
        if (when != null) {
            if (when[0] === '明日') {
                day++;
            }
            if (when[0].includes('日後')) {
                const d = when[0].replace('日後', '');
                day = Number(d);
            }
        }
        Commands.weather(message, [cityName, day.toString()]);
        return;
    }
    if (message.content.match('地域(覚|憶|おぼ)えて')) {
        const name = message.content.split(' ')[2];
        Commands.reg(message, ['pref', name]);
        return;
    }
    if (message.content.match(/\d+d\d+/)) {
        const match = message.content.match(/\d+d\d+/);
        if (match == null) {
            return;
        }
        const dice = match[0].split('d');
        Commands.dice(message, dice);
        return;
    }
    message.reply('ごめんなさい、わからなかった……');
}
