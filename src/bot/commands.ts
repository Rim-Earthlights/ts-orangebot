import { Message, MessageEmbed } from 'discord.js';
import { getRndNumber } from '../common/common';
import { Forecast, FORECAST_URI } from '../interface/forecast';
import { Geocoding, GEOCODING_URI, WorldGeocoding } from '../interface/geocoding';
import url from 'url';
import { getAsync } from '../common/webWrapper';
import { Onecall, ONECALL_URI } from '../interface/onecall';
import { CONFIG } from '../config/config';
import { Gacha, getGacha, getOmikuji, Omikuji } from './function/gacha';
import { weatherDay, weatherToday } from './function/forecast';
import { getCelo, judge } from './function/dice';
import { TypeOrm } from '../db/dbconnector';
import { Users } from '../db/models/users';
import dayjs from 'dayjs';

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
    const celo = getCelo(3);
    message.reply(`${JSON.stringify(celo, null, '\t')}`);
}

/**
 * 現在の言語、コマンドを表示する
 * @param message
 */
export async function help(message: Message) {
    const res: string[] = [];
    res.push(`今動いている言語は[TypeScript]版だよ！\n`);
    res.push('コマンドはここだよ～！');
    res.push('```');
    res.push(' * .tenki [地域]');
    res.push('   > 天気予報を取得する');
    res.push('   > 指定した地域の天気予報を取得します');
    res.push(' * .dice [ダイスの振る数] [ダイスの面の数]');
    res.push('   > サイコロを振る (例: [.dice 5 6] (6面体ダイスを5個振る))');
    res.push(' * .luck [?運勢]');
    res.push('   > おみくじを引く');
    res.push('     運勢を指定するとその運勢が出るまで引きます');
    res.push(' * .gacha [?回数or等級]');
    res.push('   > 10連ガチャを引く');
    res.push('     回数を指定するとその回数回します');
    res.push('     等級を指定するとその等級が出るまで回します');
    res.push('     等級か回数を指定した場合はプレゼントの対象外です');
    res.push(' * .celovs');
    res.push('   > チンチロリンで遊ぶ');
    res.push('     みかんちゃんとチンチロリンで遊べます');
    res.push('     3回まで投げて出た目で勝負します');
    res.push('```');
    message.reply(res.join('\n'));
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

export async function celo(message: Message) {
    const celo = getCelo(3);
    const description = [];

    const role = celo[celo.length - 1];

    for (let i = 0; i < celo.length; i++) {
        description.push(`${i + 1}: ${celo[i].role} / ${celo[i].dice.join(', ')}`);
    }

    const send = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`結果: ${role.role}`)
        .setDescription(description.join('\n'))
        .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/dice.jpg');

    message.reply({ content: `サイコロあそび！ちんちろりーん！`, embeds: [send] });
}

export async function celovs(message: Message) {
    const celoYou = getCelo(3);
    const celoEnemy = getCelo(3);
    let title, content;
    const description = [];

    const roleYou = celoYou[celoYou.length - 1];

    description.push('＊あなたの出目');
    for (let i = 0; i < celoYou.length; i++) {
        description.push(`${i + 1}: ${celoYou[i].role} / ${celoYou[i].dice.join(', ')}`);
    }

    const roleEnemy = celoEnemy[celoEnemy.length - 1];

    description.push('');
    description.push('＊みかんの出目');
    for (let i = 0; i < celoEnemy.length; i++) {
        description.push(`${i + 1}: ${celoEnemy[i].role} / ${celoEnemy[i].dice.join(', ')}`);
    }
    const result = judge(roleYou, roleEnemy);
    if (result > 0) {
        title = '勝ち';
        content = 'あなたの勝ち！つよいすっごーい！';
    } else if (result < 0) {
        title = '負け';
        content = 'わたしの勝ち！えへへやった～！';
    } else {
        title = '引き分け';
        content = '引き分けだ～！';
    }
    const send = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`結果: ${title}`)
        .setDescription(description.join('\n'))
        .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/dice.jpg');

    message.reply({ content: `サイコロあそび！ちんちろりーん！\n${content}`, embeds: [send] });
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
 * ガチャを引く
 * @param message 受け取ったメッセージング情報
 * @param args 0: 指定回数 or 等級 (出るまで引く)
 * @returns
 */
export async function gacha(message: Message, args?: string[]) {
    const gachaList: Gacha[] = [];

    if (args != undefined && args.length > 0) {
        const num = Number(args[0]);
        if (num) {
            for (let i = 0; i < num; i++) {
                const gacha = getGacha();
                gachaList.push(gacha);
            }
        } else {
            do {
                const gacha = getGacha();
                gachaList.push(gacha);
                if (gacha.rare === args[0].toUpperCase()) {
                    if (!gacha.description.includes('連チケット')) {
                        break;
                    }
                }
                if (
                    gacha.description.includes(args[0]) &&
                    !['N', 'C', 'UC', 'R', 'SR', 'SSR', 'UR', 'UUR'].find((r) => r === args[0].toUpperCase())
                ) {
                    break;
                }
                if (gachaList.length > 1_000_000) {
                    const send = new MessageEmbed()
                        .setColor('#ff0000')
                        .setTitle(`エラー`)
                        .setDescription(`1,000,000回引いても該当の等級が出なかった`);

                    message.reply({ content: `ガチャ、出なかったみたい・・・`, embeds: [send] });
                    return;
                }
                // eslint-disable-next-line no-constant-condition
            } while (true);
        }

        const rareList = [...new Set(gachaList.map((g) => g.rare))];

        // 等級と総数
        const fields = rareList.map((r) => {
            return {
                name: r,
                value: gachaList.filter((l) => l.rare === r).length.toString()
            };
        });
        fields.push({ name: '総数', value: gachaList.length.toString() });

        // 等級の高い順に並び替える
        const t = gachaList.sort((a, b) => {
            return a.rank - b.rank;
        });

        const highTier = t.slice(0, 30);
        highTier.reverse();

        const desc = highTier.map((g) => `[${g.rare}] ` + g.description).join('\n');

        console.log(highTier);
        const send = new MessageEmbed()
            .setColor('#ff9900')
            .setTitle(`${gachaList.length}連の結果: 高い順から30個まで表示しています`)
            .setDescription(`${highTier.map((g) => `[${g.rare}] ` + g.description).join('\n')}`)
            .setFields(fields)
            .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png');

        message.reply({ content: `ガチャを${gachaList.length}回ひいたよ！(_**景品無効**_)`, embeds: [send] });
    } else {
        for (let i = 0; i < 10; i++) {
            const gacha = getGacha();
            gachaList.push(gacha);
        }

        // 10連チケットを引いた分だけ加算する
        let ticket_10 = gachaList.filter((g) => g.description === ':tickets: ガチャ+10連チケット').length;
        let ticket_20 = gachaList.filter((g) => g.description === ':tickets: ガチャ+20連チケット').length;
        do {
            const tempList = [];

            if (ticket_10 > 0) {
                for (let i = 0; i < 10; i++) {
                    const gacha = getGacha();
                    tempList.push(gacha);
                    gachaList.push(gacha);
                }
                ticket_10--;
            } else if (ticket_20 > 0) {
                for (let i = 0; i < 20; i++) {
                    const gacha = getGacha();
                    tempList.push(gacha);
                    gachaList.push(gacha);
                }
                ticket_20--;
            }

            ticket_10 += tempList.filter((g) => g.description === ':tickets: ガチャ+10連チケット').length;
            ticket_20 += tempList.filter((g) => g.description === ':tickets: ガチャ+20連チケット').length;

            if (ticket_10 <= 0 && ticket_20 <= 0) {
                break;
            }
            // eslint-disable-next-line no-constant-condition
        } while (true);
        console.log(gachaList);

        const t = gachaList.sort((a, b) => {
            return a.rank - b.rank;
        });

        const highTier = t.slice(0, 30);
        t.reverse();

        const desc = t.map((g) => `[${g.rare}] ` + g.description).join('\n');

        if (desc.length > 4096) {
            const send = new MessageEmbed()
                .setColor('#ff9900')
                .setTitle(`${gachaList.length}連の結果: 高い順に30要素のみ抜き出しています`)
                .setDescription(`${highTier.map((g) => `[${g.rare}] ` + g.description).join('\n')}`)
                .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png');
            message.reply({ content: `ガチャだよ！からんころーん！(景品は一日の最初の一回のみです)`, embeds: [send] });
        } else {
            const send = new MessageEmbed()
                .setColor('#ff9900')
                .setTitle(`${gachaList.length}連の結果`)
                .setDescription(`${desc}`)
                .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png');
            message.reply({ content: `ガチャだよ！からんころーん！(景品は一日の最初の一回のみです)`, embeds: [send] });
        }
    }
}

/**
 * おみくじを引く
 * @param message 受け取ったメッセージング情報
 * @returns
 */
export async function luck(message: Message, args?: string[]) {
    const omikujis: Omikuji[] = [];

    if (args != undefined && args.length > 0) {
        do {
            const o = getOmikuji();
            omikujis.push(o);
            if (o.luck === args[0]) {
                break;
            }
            if (omikujis.length > 500) {
                const send = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle(`エラー`)
                    .setDescription(`500回引いても該当のおみくじが出なかった`);

                message.reply({ content: `おみくじ、出なかったみたい・・・`, embeds: [send] });
                return;
            }
            // eslint-disable-next-line no-constant-condition
        } while (true);

        const send = new MessageEmbed()
            .setColor('#ff9900')
            .setTitle(`${omikujis.length}回目で出たよ！`)
            .setDescription(`${omikujis.map((o) => o.luck).join(', ')}`)
            .addFields({
                name: '大吉',
                value: omikujis.filter((o) => o.luck === '大吉').length.toString()
            })
            .addFields({
                name: '吉',
                value: omikujis.filter((o) => o.luck === '吉').length.toString()
            })
            .addFields({
                name: '中吉',
                value: omikujis.filter((o) => o.luck === '中吉').length.toString()
            })
            .addFields({
                name: '小吉',
                value: omikujis.filter((o) => o.luck === '小吉').length.toString()
            })
            .addFields({
                name: '末吉',
                value: omikujis.filter((o) => o.luck === '末吉').length.toString()
            })
            .addFields({
                name: '凶',
                value: omikujis.filter((o) => o.luck === '凶').length.toString()
            })
            .addFields({
                name: '大凶',
                value: omikujis.filter((o) => o.luck === '大凶').length.toString()
            })
            .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/mikuji.png');

        message.reply({ content: `おみくじ！がらがらがら～！`, embeds: [send] });
        return;
    } else {
        const omikuji = getOmikuji();

        const send = new MessageEmbed()
            .setColor('#ff9900')
            .setTitle(omikuji.luck)
            .setDescription(omikuji.description)
            .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/mikuji.png');

        message.reply({ content: `おみくじ！がらがらがら～！`, embeds: [send] });
        return;
    }
}

export async function reg(message: Message, args?: string[]): Promise<void> {
    if (!args || args.length <= 1) {
        return;
    }

    const regType = args[0];
    const regName = args[1];

    switch (regType) {
        case 'pref': {
            const userId = message.author.id;
            const users = TypeOrm.dataSource.getRepository(Users);
            const user = await users.findOne({ where: { userId: userId } });
            const regUser = users.create({
                userId: userId,
                pref: regName,
                createdAt: user?.createdAt ? user.createdAt : dayjs().format()
            });
            await users.save(regUser);

            const send = new MessageEmbed().setColor('#ff9900').setTitle(`登録`).setDescription(`居住地: ${regName}`);

            message.reply({ content: `以下の内容で登録したよ～！`, embeds: [send] });
            break;
        }
        default:
            break;
    }
}
