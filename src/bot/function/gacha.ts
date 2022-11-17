/**
 * ガチャ関連処理
 * おみくじもここで処理している
 */

import dayjs from 'dayjs';
import { EmbedBuilder, Message } from 'discord.js';
import { getRndNumber } from '../../common/common';
import { CONFIG } from '../../config/config';
import { GACHA_MONEY_LIST } from '../../constant/gacha/gachaList';
import { GachaRepository } from '../../model/repository/gachaRepository';
import { UsersRepository } from '../../model/repository/usersRepository';
import * as logger from '../../common/logger';

/**
 * ランダムにガチャを一度引く
 * @returns
 */
function getGachaOnce(): Gacha {
    const rnd = Math.random();
    let rare;
    let description;
    let rank;

    if (rnd < 0.0000988) {
        rare = 'UUR';
        const index = getRndNumber(1, GACHA_MONEY_LIST.UUR.length) - 1;
        description = `:crown: ${GACHA_MONEY_LIST.UUR[index]}`;
        rank = 0;
    } else if (rnd < 0.00048) {
        rare = 'UR';
        const index = getRndNumber(1, GACHA_MONEY_LIST.UR.length) - 1;
        description = `:sparkles: ${GACHA_MONEY_LIST.UR[index]}`;
        rank = 1;
    } else if (rnd < 0.0266) {
        rare = 'SSR';
        const index = getRndNumber(1, GACHA_MONEY_LIST.SSR.length) - 1;
        description = `${GACHA_MONEY_LIST.SSR[index].includes('ガチャ+') ? ':tickets:' : ':star:'} ${
            GACHA_MONEY_LIST.SSR[index]
        }`;
        rank = 2;
    } else if (rnd < 0.15928) {
        rare = 'SR';
        const index = getRndNumber(1, GACHA_MONEY_LIST.SR.length) - 1;
        description = `${GACHA_MONEY_LIST.SR[index].includes('ガチャ+') ? ':tickets:' : ''} ${
            GACHA_MONEY_LIST.SR[index]
        }`;
        rank = 3;
    } else if (rnd < 0.668) {
        rare = 'R';
        const index = getRndNumber(1, GACHA_MONEY_LIST.R.length) - 1;
        description = ` ${GACHA_MONEY_LIST.R[index]}`;
        rank = 4;
    } else if (rnd < 0.8889) {
        rare = 'UC';
        const index = getRndNumber(1, GACHA_MONEY_LIST.UC.length) - 1;
        description = `${GACHA_MONEY_LIST.UC[index]}`;
        rank = 5;
    } else {
        rare = 'C';
        const index = getRndNumber(1, GACHA_MONEY_LIST.C.length) - 1;
        description = `${GACHA_MONEY_LIST.C[index]}`;
        rank = 6;
    }
    return {
        rare,
        description,
        rank
    };
}

/**
 * ガチャを引く
 * @param message 受け取ったメッセージング情報
 * @param args 0: 指定回数 or 等級 (出るまで引く)
 * @returns
 */
export async function pickGacha(message: Message, args?: string[]) {
    const gachaList: Gacha[] = [];

    if (args != undefined && args.length > 0) {
        if (args[0] === 'reset') {
            if (!CONFIG.ADMIN_USER_ID.includes(message.author.id)) {
                message.reply({
                    content: `ガチャフラグのリセット権限がないアカウントだよ！管理者にお願いしてね！`
                });
                return;
            }
            if (args[1]) {
                const users = new UsersRepository();
                const user = await users.get(args[1]);
                if (!user) {
                    message.reply({
                        content: `リセットしようとするユーザが登録されてないみたい…？`
                    });
                    return;
                }
                await users.resetGacha(args[1]);
                message.reply({
                    content: `${user?.userName ? user.userName : user.id} さんのガチャフラグをリセットしたよ～！`
                });
            }
            return;
        }

        const num = Number(args[0]);
        if (num) {
            for (let i = 0; i < num; i++) {
                const gacha = getGachaOnce();
                gachaList.push(gacha);
            }
        } else {
            do {
                const gacha = getGachaOnce();
                gachaList.push(gacha);
                if (gacha.rare === args[0].toUpperCase()) {
                    if (!gacha.description.includes('連チケット')) {
                        break;
                    }
                }
                if (
                    gacha.description.includes(args[0]) &&
                    !['C', 'UC', 'R', 'SR', 'SSR', 'UR', 'UUR'].find((r) => r === args[0].toUpperCase())
                ) {
                    break;
                }
                if (gachaList.length > 1_000_000) {
                    const send = new EmbedBuilder()
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
            const length = gachaList.filter((l) => l.rare === r).length;
            return {
                name: r,
                value: length.toString() + ` > 確率: ${((length / gachaList.length) * 100).toFixed(4)}%`
            };
        });
        fields.push({ name: '総数', value: gachaList.length.toString() });

        // 等級の高い順に並び替える
        const t = gachaList.sort((a, b) => {
            return a.rank - b.rank;
        });

        const highTier = t.slice(0, 50);
        highTier.reverse();

        const send = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(`${gachaList.length}連の結果: 高い順から50個まで表示しています`)
            .setDescription(`${highTier.map((g) => `[${g.rare}] ` + g.description).join('\n')}`)
            .setFields(fields)
            .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png');

        message.reply({ content: `ガチャを${gachaList.length}回ひいたよ！(_**景品無効**_)`, embeds: [send] });
    } else {
        const users = new UsersRepository();
        const user = await users.get(message.author.id);

        if (user) {
            if (user.gachaDate) {
                if (user.gachaDate >= dayjs().hour(0).minute(0).second(0).toDate()) {
                    const send = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle(`エラー`)
                        .setDescription(`ガチャ抽選済`);

                    message.reply({ content: `もう抽選してるみたい！2回目はだめだよ！`, embeds: [send] });
                    return;
                }
            }
        } else {
            await users.save({ id: message.author.id, userName: message.author.tag });
        }

        for (let i = 0; i < 10; i++) {
            const gacha = getGachaOnce();
            gachaList.push(gacha);
        }

        // 10連チケットを引いた分だけ加算する
        let ticket_10 = gachaList.filter((g) => g.description === ':tickets: ガチャ+10連チケット').length;
        let ticket_20 = gachaList.filter((g) => g.description === ':tickets: ガチャ+20連チケット').length;
        do {
            const tempList = [];

            if (ticket_10 > 0) {
                for (let i = 0; i < 10; i++) {
                    const gacha = getGachaOnce();
                    tempList.push(gacha);
                    gachaList.push(gacha);
                }
                ticket_10--;
            } else if (ticket_20 > 0) {
                for (let i = 0; i < 20; i++) {
                    const gacha = getGachaOnce();
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

        const t = gachaList.sort((a, b) => {
            return a.rank - b.rank;
        });

        const highTier = t.slice(0, 50);
        t.reverse();

        const gachaTable = new GachaRepository();
        const nowTime = dayjs().toDate();
        const createTables = t.map((g) => {
            return {
                user_id: message.author.id,
                gachaTime: nowTime,
                rare: g.rare,
                rank: g.rank,
                description: g.description
            };
        });

        await gachaTable.save(createTables);

        await users.save({
            id: message.author.id,
            userName: message.author.tag,
            gachaDate: dayjs().toDate()
        });
        const presents = t.filter((g) => g.description.includes('_**プレゼント**_'));
        const desc = t.map((g) => `[${g.rare}] ` + g.description).join('\n');

        if (t.length > 99) {
            const send = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle(`${gachaList.length}連の結果: 高い順に50要素のみ抜き出しています`)
                .setDescription(`${highTier.map((g) => `[${g.rare}] ` + g.description).join('\n')}`)
                .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png');
            message.reply({ content: `ガチャだよ！からんころーん！(景品は一日の最初の一回のみです)`, embeds: [send] });
            if (presents.length > 0) {
                const send = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('プレゼントだ～！おめでと～！！')
                    .setDescription(presents.map((p) => `${p.rare}: ${p.description}`).join('\n'))
                    .setFields({ name: '通知:', value: '<@246007305156558848>' });
                message.channel.send({ embeds: [send] });
            }
        } else {
            const send = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle(`${gachaList.length}連の結果`)
                .setDescription(`${desc}`)
                .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png');
            message.reply({ content: `ガチャだよ！からんころーん！(景品は一日の最初の一回のみです)`, embeds: [send] });
            if (presents.length > 0) {
                const send = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('プレゼントだ～！おめでと～！！')
                    .setDescription(presents.map((p) => `${p.rare}: ${p.description}`).join('\n'))
                    .setFields({ name: '通知用:', value: '<@246007305156558848>' });
                message.channel.send({ embeds: [send] });
            }
        }
    }
}

/**
 * おみくじを引く
 * @param message 受け取ったメッセージング情報
 * @returns
 */
export async function pickOmikuji(message: Message, args?: string[]) {
    const omikujis: Omikuji[] = [];

    if (args != undefined && args.length > 0) {
        do {
            const o = getOmikujiOnce();
            omikujis.push(o);
            if (o.luck === args[0]) {
                break;
            }
            if (omikujis.length > 500) {
                const send = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`エラー`)
                    .setDescription(`500回引いても該当のおみくじが出なかった`);

                message.reply({ content: `おみくじ、出なかったみたい・・・`, embeds: [send] });
                return;
            }
            // eslint-disable-next-line no-constant-condition
        } while (true);

        const send = new EmbedBuilder()
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
        const omikuji = getOmikujiOnce();

        const send = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(omikuji.luck)
            .setDescription(omikuji.description)
            .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/mikuji.png');

        message.reply({ content: `おみくじ！がらがらがら～！`, embeds: [send] });
        return;
    }
}

/**
 * ランダムにおみくじを一度引く
 * @returns
 */
function getOmikujiOnce(): Omikuji {
    const rnd = Math.random();
    let luck = '';
    let description = '';

    if (rnd < 0.141) {
        luck = '大吉';
        description = 'おめでとういいことあるよ！！！';
    } else if (rnd < 0.426) {
        luck = '吉';
        description = '結構よき！誇っていいよ！';
    } else if (rnd < 0.56) {
        luck = '中吉';
        description = 'それなりにいいことありそう。';
    } else if (rnd < 0.692) {
        luck = '小吉';
        description = 'ふつうがいちばんだよね。';
    } else if (rnd < 0.831) {
        luck = '末吉';
        description = 'まあこういうときもあるよね。';
    } else if (rnd < 0.975) {
        luck = '凶';
        description = '気をつけようね。';
    } else {
        luck = '大凶';
        description = '逆にレアだしポジティブに考えてこ';
    }
    return {
        luck,
        description
    };
}

export interface Gacha {
    rare: string;
    description: string;
    rank: number;
}

export interface Omikuji {
    luck: string;
    description: string;
}
