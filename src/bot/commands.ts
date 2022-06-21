import { Message, MessageEmbed } from 'discord.js';
import { getRndNumber } from '../common/common';
import axios from 'axios';
import { Forecast, FORECAST_URI } from '../constant/forecast/forecast';
import { Geocoding, GEOCODING_URI } from '../constant/forecast/geocoding';
import url from 'url';

/**
 * Ping-Pong
 * 疎通確認のコマンドです.
 *
 * @param message 受け取ったメッセージング情報
 */
export async function ping(message: Message) {
    message.reply('pong!');
}

/**
 * デバッグ用コマンドです.
 * 通常は使用しなくても良い.
 * @param message 受け取ったメッセージング情報
 * @param args 引数
 */
export async function debug(message: Message, args?: string[]) {
    message.reply(`args: ${args}`);
}

/**
 * 現在の言語、コマンドを表示する
 * @param message
 */
export async function help(message: Message) {
    let res = `今動いている言語は[TypeScript]版だよ！\n`;
    res += 'コマンドはここだよ～！';
    res += '```';
    res += '.dice [ダイスの振る数] [ダイスの面の数]';
    res += ' > サイコロを振る (例: [.dice 5 6] (6面体ダイスを5個振る))';
    res += '.luck';
    res += ' > おみくじを引く';
    res += '```';
    message.reply(res);
    return;
}

/**
 * サイコロを振る
 * @param message
 * @param args 0: x回振る 1: x面体
 * @returns
 */
export async function dice(message: Message, args?: string[]) {
    if (args == undefined || args.length < 2) {
        message.reply('どう振っていいのかわかんない！！\n(例: [.dice 5 6] 6面体ダイスを5回振る のように指定してね)');
        return;
    }

    const diceNum = Number(args[0]);
    const diceMax = Number(args[1]);

    if (diceNum <= 0 || diceMax <= 0) {
        const send = new MessageEmbed().setColor('#ff0000').setTitle('失敗').setDescription('ダイスの数が0以下です');

        message.reply({ content: `いじわる！きらい！`, embeds: [send] });
        return;
    }

    if (diceNum >= 1000) {
        const send = new MessageEmbed().setColor('#ff0000').setTitle('失敗').setDescription('ダイスの数が多すぎます');

        message.reply({ content: `一度にそんなに振れないよ～……`, embeds: [send] });
        return;
    }

    const result = [];
    for (let i = 0; i < diceNum; i++) {
        result.push(getRndNumber(1, diceMax));
    }

    const diceResult = result.join(', ');
    if (diceResult.length >= 4096) {
        const send = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('失敗')
            .setDescription('4096文字以上の文字の送信に失敗');

        message.reply({ content: `振らせすぎ！もうちょっと少なくして～！`, embeds: [send] });
        return;
    }

    const send = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('サイコロ振ったよ～！')
        .setDescription(diceResult)
        .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/dice.jpg')
        .addFields({
            name: '足した結果',
            value: result
                .reduce((sum, el) => {
                    return sum + el;
                }, 0)
                .toString()
        })
        .addFields({
            name: '平均値',
            value: (
                result.reduce((sum, el) => {
                    return sum + el;
                }, 0) / diceNum
            )
                .toFixed(2)
                .toString()
        });

    message.reply({ content: `${diceMax}面ダイスを${diceNum}個ね！まかせて！`, embeds: [send] });
}

/**
 * 現在の天気を返す.
 * @param message 受け取ったメッセージング情報
 * @param args 地名
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function weather(message: Message, args?: string[]) {
    try {
        const forecastKey = process.env.FORECAST_KEY;
        if (!forecastKey) {
            throw new Error('天気情報取得用のAPIキーが登録されていません');
        }

        const geoResponse = await axios.get(GEOCODING_URI, {
            params: new url.URLSearchParams({
                q: '相模原市',
                limit: '5',
                appid: forecastKey,
                lang: 'ja',
                unit: 'metric'
            })
        });

        const geoList = <Geocoding[]>geoResponse.data;

        const geocoding = geoList.find((g) => g.country === 'JP');

        if (geocoding == undefined) {
            throw new Error('名前から場所を検索できませんでした');
        }

        const forecastResponse = await axios.get(FORECAST_URI, {
            params: new url.URLSearchParams({
                lat: geocoding.lat.toString(),
                lon: geocoding.lon.toString(),
                appid: forecastKey,
                lang: 'ja',
                units: 'metric'
            })
        });
        const forecast = <Forecast>forecastResponse.data;
        let description = `${forecast.weather[0].main}(${forecast.weather[0].description})`;
        description += ``;

        const send = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('相模原市の天気')
            .setDescription(JSON.stringify(description, null, 2));

        message.reply({ content: `今日の天気ね！はいどーぞ！`, embeds: [send] });
    } catch (e) {
        const error = <Error>e;
        const send = new MessageEmbed().setColor('#f00').setTitle('エラー').setDescription(error.message);

        message.reply({ content: `ありゃ、エラーみたい…なんだろ？`, embeds: [send] });
    }
}

/**
 * 今日の天気を返す.
 * @param message 受け取ったメッセージング情報
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function weatherToday(message: Message) {
    console.log('Not Implements.');
    return;
}

/**
 * おみくじを引く
 * @param message 受け取ったメッセージング情報
 * @returns
 */
export async function luck(message: Message) {
    const rnd = getRndNumber(0, 999);
    let luck = '';
    let luckDescription = '';

    if (rnd < 141) {
        luck = '大吉';
        luckDescription = 'おめでとういいことあるよ！！！';
    } else if (rnd < 426) {
        luck = '吉';
        luckDescription = '結構よき！誇っていいよ！';
    } else if (rnd < 560) {
        luck = '中吉';
        luckDescription = 'それなりにいいことありそう。';
    } else if (rnd < 692) {
        luck = '小吉';
        luckDescription = 'ふつうがいちばんだよね。';
    } else if (rnd < 831) {
        luck = '末吉';
        luckDescription = 'まあこういうときもあるよね。';
    } else if (rnd < 975) {
        luck = '凶';
        luckDescription = '気をつけようね。';
    } else {
        luck = '大凶';
        luckDescription = '逆にレアだしポジティブに考えてこ';
    }

    const send = new MessageEmbed()
        .setColor('#ff9900')
        .setTitle(luck)
        .setDescription(luckDescription)
        .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/mikuji.png');

    message.reply({ content: `おみくじ！がらがらがら～！`, embeds: [send] });
    return;
}
