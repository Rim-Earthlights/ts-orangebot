import { Message, MessageEmbed } from 'discord.js';
import { getRndNumber } from '../common/common';
import axios from 'axios';
import { Forecast, FORECAST_URI } from '../interface/forecast';
import { Geocoding, GEOCODING_URI } from '../interface/geocoding';
import url from 'url';
import { getAsync } from '../common/webWrapper';
import { Onecall, ONECALL_URI } from '../interface/onecall';
import { CONFIG } from '../config/config';

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
    res += 'コマンドはここだよ～！\n';
    res += '```\n';
    res += '.dice [ダイスの振る数] [ダイスの面の数]\n';
    res += ' > サイコロを振る (例: [.dice 5 6] (6面体ダイスを5個振る))\n';
    res += '.luck\n';
    res += ' > おみくじを引く\n';
    res += '```\n';
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
export async function weather(message: Message, args?: string[]) {
    try {
        const forecastKey = process.env.FORECAST_KEY;
        if (!forecastKey) {
            throw new Error('天気情報取得用のAPIキーが登録されていません');
        }
        if (args == undefined || args.length === 0) {
            throw new Error('地名が入力されていません');
        }

        const cityName = args[0];
        let day = 0;

        const addDay = Number(args[1]);
        if (addDay != undefined && addDay <= 6) {
            day = day + addDay;
        }

        const geoResponse = await getAsync(
            GEOCODING_URI,
            new url.URLSearchParams({
                q: cityName,
                limit: '5',
                appid: forecastKey,
                lang: 'ja',
                unit: 'metric'
            })
        );

        const geoList = <Geocoding[]>geoResponse.data;

        const geocoding = geoList.find((g) => g.country === 'JP');

        if (geocoding == undefined) {
            throw new Error('名前から場所を検索できませんでした');
        }

        console.log('> return geocoding API');
        console.log(`  * lat: ${geocoding.lat.toString()}, lon: ${geocoding.lon.toString()}`);
        console.log(`  * name: ${geocoding.name}`);
        console.log('');

        const forecastResponse = await getAsync(
            FORECAST_URI,
            new url.URLSearchParams({
                lat: geocoding.lat.toString(),
                lon: geocoding.lon.toString(),
                appid: forecastKey,
                lang: 'ja',
                units: 'metric'
            })
        );

        const onecallResponse = await getAsync(
            ONECALL_URI,
            new url.URLSearchParams({
                lat: geocoding.lat.toString(),
                lon: geocoding.lon.toString(),
                exclude: 'current,minutely,hourly',
                appid: forecastKey,
                units: 'metric',
                lang: 'ja'
            })
        );

        const forecast = <Forecast>forecastResponse.data;
        const onecall = <Onecall>onecallResponse.data;

        let description: string[] = [];
        if (day === 0) {
            description = await weatherToday(forecast, onecall);
        } else {
            description = await weatherDay(onecall);
        }

        const send = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${cityName} の天気`)
            .setDescription(description.join('\n'))
            .setThumbnail(`http://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`);

        if (day === 0) {
            message.reply({ content: `今日の天気ね！はいどーぞ！`, embeds: [send] });
        } else if (day === 1) {
            message.reply({ content: `明日の天気ね！はいどーぞ！`, embeds: [send] });
        } else {
            message.reply({ content: `${day}日後の天気ね！はいどーぞ！`, embeds: [send] });
        }
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
export async function weatherToday(forecast: Forecast, onecall: Onecall) {
    const forecastKey = CONFIG.FORECAST_KEY;

    // 気温や気象情報
    const weather = forecast.weather[0].description;
    const temp = forecast.main.temp.toFixed(1);
    const feelLike = forecast.main.feels_like.toFixed(1);
    const tempMin = forecast.main.temp_min.toFixed(1);
    const tempMax = forecast.main.temp_max.toFixed(1);

    // 降水確率
    const humidityDay = onecall.daily[0].humidity;
    // UVインデックス
    const uvi = onecall.daily[0].uvi;
    // 風
    const windDeg = forecast.wind.deg;
    const windSpeed = forecast.wind.speed.toFixed(0);

    // 情報の整形
    const description = [];
    description.push(`天候: ${weather}`);
    description.push(`気温: ${temp} ℃ (${tempMin} ℃/${tempMax} ℃)`);
    description.push(`体感: ${feelLike} ℃`);
    description.push(`降水確率: ${humidityDay} ％`);

    if (uvi >= 11) {
        description.push(`UV指数: ${uvi} (極端に強い)`);
    } else if (uvi >= 8) {
        description.push(`UV指数: ${uvi} (非常に強い)`);
    } else if (uvi >= 6) {
        description.push(`UV指数: ${uvi} (強い)`);
    } else if (uvi >= 3) {
        description.push(`UV指数: ${uvi} (中程度)`);
    } else {
        description.push(`UV指数: ${uvi} (弱い)`);
    }

    if (windDeg >= 337.5 || windDeg <= 22.5) {
        description.push(`風速: 北 ${windSpeed}m/s`);
    } else if (windDeg > 292.5) {
        description.push(`風速: 北西 ${windSpeed}m/s`);
    } else if (windDeg > 247.5) {
        description.push(`風速: 西 ${windSpeed}m/s`);
    } else if (windDeg > 202.5) {
        description.push(`風速: 南西 ${windSpeed}m/s`);
    } else if (windDeg > 157.5) {
        description.push(`風速: 南 ${windSpeed}m/s`);
    } else if (windDeg > 112.5) {
        description.push(`風速: 南東 ${windSpeed}m/s`);
    } else if (windDeg > 67.5) {
        description.push(`風速: 東 ${windSpeed}m/s`);
    } else {
        description.push(`風速: 北東 ${windSpeed}m/s`);
    }
    return description;
}

async function weatherDay(onecall: Onecall): Promise<string[]> {
    throw 'Not Implement Error';
}

/**
 * おみくじを引く
 * @param message 受け取ったメッセージング情報
 * @returns
 */
export async function luck(message: Message) {
    const rnd = Math.random();
    let luck = '';
    let luckDescription = '';

    if (rnd < 0.141) {
        luck = '大吉';
        luckDescription = 'おめでとういいことあるよ！！！';
    } else if (rnd < 0.426) {
        luck = '吉';
        luckDescription = '結構よき！誇っていいよ！';
    } else if (rnd < 0.56) {
        luck = '中吉';
        luckDescription = 'それなりにいいことありそう。';
    } else if (rnd < 0.692) {
        luck = '小吉';
        luckDescription = 'ふつうがいちばんだよね。';
    } else if (rnd < 0.831) {
        luck = '末吉';
        luckDescription = 'まあこういうときもあるよね。';
    } else if (rnd < 0.975) {
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
