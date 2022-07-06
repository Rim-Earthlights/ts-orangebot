import { Message, MessageEmbed } from 'discord.js';
import { getRndNumber } from '../common/common';
import { Forecast, FORECAST_URI } from '../interface/forecast';
import { Geocoding, GEOCODING_URI, WorldGeocoding } from '../interface/geocoding';
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
        const send = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('失敗')
            .setDescription('[.dice 5 6] 6面体ダイスを5回振る のように指定してね');

        message.reply({ content: `どう振っていいのかわかんない！！`, embeds: [send] });
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
 * @param args 0: 地名 1: x日後(number | undefined)
 * @returns
 */
export async function weather(message: Message, args?: string[]) {
    try {
        const forecastKey = CONFIG.FORECAST_KEY;
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
            'http://geoapi.heartrails.com/api/json',
            new url.URLSearchParams({
                method: 'suggest',
                keyword: cityName,
                matching: 'like'
            })
        );

        let lat: number, lon: number;

        const response = (<Geocoding>geoResponse.data).response;
        const geoList = response.location;

        if (response.error != undefined || geoList.length <= 0) {
            console.log(' > geocoding(JP) not found');

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

            const geoList = <WorldGeocoding[]>geoResponse.data;

            if (geoList == undefined || geoList.length <= 0) {
                throw new Error('名前から場所を検索できませんでした');
            }

            lat = geoList[0].lat;
            lon = geoList[0].lon;

            console.log('> return geocoding API');
            console.log(`  * lat: ${lat}, lon: ${lon}`);
            console.log(`  * name: ${geoList[0].local_names}`);
        } else {
            lat = geoList[0].y;
            lon = geoList[0].x;

            console.log('> return geocoding API');
            console.log(`  * lat: ${lat}, lon: ${lon}`);
            console.log(`  * name: ${geoList[0].prefecture}${geoList[0].city}, ${geoList[0].town}`);
        }

        const forecastResponse = await getAsync(
            FORECAST_URI,
            new url.URLSearchParams({
                lat: lat.toString(),
                lon: lon.toString(),
                appid: forecastKey,
                lang: 'ja',
                units: 'metric'
            })
        );

        const onecallResponse = await getAsync(
            ONECALL_URI,
            new url.URLSearchParams({
                lat: lat.toString(),
                lon: lon.toString(),
                exclude: 'current,minutely,hourly',
                appid: forecastKey,
                units: 'metric',
                lang: 'ja'
            })
        );

        const forecast = <Forecast>forecastResponse.data;
        const onecall = <Onecall>onecallResponse.data;

        let description: string[] = [];
        let icon = '';
        if (day === 0) {
            description = await weatherToday(forecast, onecall);
            icon = forecast.weather[0].icon;
        } else {
            description = await weatherDay(onecall, day);
            icon = onecall.daily[day].weather[0].icon;
        }

        const send = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${cityName} の天気`)
            .setDescription(description.join('\n'))
            .setThumbnail(`http://openweathermap.org/img/wn/${icon}@2x.png`);

        if (day === 0) {
            message.reply({ content: `今日の天気ね！はいどーぞ！`, embeds: [send] });
        } else if (day === 1) {
            message.reply({ content: `明日の天気ね！はいどーぞ！`, embeds: [send] });
        } else {
            message.reply({ content: `${day}日後の天気ね！はいどーぞ！`, embeds: [send] });
        }
    } catch (e) {
        const error = <Error>e;
        const send = new MessageEmbed().setColor('#ff0000').setTitle('エラー').setDescription(error.message);

        message.reply({ content: `ありゃ、エラーみたい…なんだろ？`, embeds: [send] });
    }
}

/**
 * 今日の天気を返す.
 * @param forecast
 * @param onecall
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function weatherToday(forecast: Forecast, onecall: Onecall) {
    // 気温や気象情報
    const weather = forecast.weather[0].description;
    const cloud = forecast.clouds.all;
    const temp = forecast.main.temp.toFixed(1);
    const feelLike = forecast.main.feels_like.toFixed(1);
    const tempMin = onecall.daily[0].temp.min.toFixed(1);
    const tempMax = onecall.daily[0].temp.max.toFixed(1);

    // 降水確率
    const popDay = (onecall.daily[0].pop * 100).toFixed(0);
    const humidityDay = onecall.daily[0].humidity;
    // UVインデックス
    const uvi = uvstr(onecall.daily[0].uvi);
    // 風
    const windDeg = findDeg(forecast.wind.deg);
    const windSpeed = forecast.wind.speed.toFixed(0);

    const description = [];

    if (forecast.sys.country === 'JP') {
        const geores = await getAsync(
            'http://geoapi.heartrails.com/api/json?method=searchByGeoLocation',
            new URLSearchParams({
                x: forecast.coord.lon.toString(),
                y: forecast.coord.lat.toString()
            })
        );
        const data = geores.data;

        // 情報の整形
        description.push(`緯度: ${forecast.coord.lat} / 経度: ${forecast.coord.lon}`);
        description.push(`実際の場所: ${data.response.location[0].prefecture}${data.response.location[0].city}`);
        description.push('');
    } else {
        description.push(`緯度: ${forecast.coord.lat} / 経度: ${forecast.coord.lon}`);
        description.push(
            `実際の場所: https://www.google.co.jp/maps/search/${forecast.coord.lat},${forecast.coord.lon}/`
        );
        description.push('');
    }

    description.push(`天候: ${weather} (雲の量: ${cloud} ％)`);
    description.push(`気温: ${temp} ℃ (${tempMin} ℃/${tempMax} ℃)`);
    description.push(`体感: ${feelLike} ℃`);
    description.push(`降水確率: ${popDay} ％ | 湿度: ${humidityDay} ％`);

    description.push(`風速: ${windDeg} ${windSpeed}m/s`);
    description.push(`UV指数: ${uvi}`);
    return description;
}

/**
 * 指定日の天気を返す
 * @param onecall
 * @param index
 * @returns
 */
async function weatherDay(onecall: Onecall, index: number): Promise<string[]> {
    // 気温や気象情報
    const weather = onecall.daily[index].weather[0].description;
    const cloud = onecall.daily[index].clouds;
    const temp = onecall.daily[index].temp.day.toFixed(1);
    const feelLike = onecall.daily[index].feels_like.day.toFixed(1);
    const tempMin = onecall.daily[index].temp.min.toFixed(1);
    const tempMax = onecall.daily[index].temp.max.toFixed(1);

    // 降水確率
    const popDay = (onecall.daily[index].pop * 100).toFixed(0);
    const humidityDay = onecall.daily[index].humidity;
    // UVインデックス
    const uvi = uvstr(onecall.daily[index].uvi);
    // 風
    const windDeg = findDeg(onecall.daily[index].wind_deg);
    const windSpeed = onecall.daily[index].wind_speed.toFixed(0);

    // 情報の整形
    const description = [];
    description.push(`天候: ${weather} (雲の量: ${cloud} ％)`);
    description.push(`気温: ${temp} ℃ (${tempMin} ℃/${tempMax} ℃)`);
    description.push(`体感: ${feelLike} ℃`);
    description.push(`降水確率: ${popDay} ％ | 湿度: ${humidityDay} ％`);

    description.push(`風速: ${windDeg} ${windSpeed}m/s`);
    description.push(`UV指数: ${uvi}`);

    return description;
}

/**
 * UV指数に強さを入れて返す
 * @param uvi
 * @returns
 */
function uvstr(uvi: number): string {
    if (uvi >= 11) {
        return `${uvi} (極端に強い)`;
    } else if (uvi >= 8) {
        return `${uvi} (非常に強い)`;
    } else if (uvi >= 6) {
        return `${uvi} (強い)`;
    } else if (uvi >= 3) {
        return `${uvi} (中程度)`;
    } else {
        return `${uvi} (弱い)`;
    }
}

/**
 * 風向を返す
 * @param deg Forecast.wind.deg
 * @returns 方角
 */
function findDeg(deg: number): string {
    if (deg >= 337.5 || deg <= 22.5) {
        return '北';
    } else if (deg > 292.5) {
        return '北西';
    } else if (deg > 247.5) {
        return '西';
    } else if (deg > 202.5) {
        return '南西';
    } else if (deg > 157.5) {
        return '南';
    } else if (deg > 112.5) {
        return '南東';
    } else if (deg > 67.5) {
        return '東';
    } else {
        return '北東';
    }
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
