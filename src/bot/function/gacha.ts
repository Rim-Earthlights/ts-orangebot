/**
 * ガチャ関連処理
 * おみくじもここで処理している
 */

import dayjs from 'dayjs';
import { EmbedBuilder, Message } from 'discord.js';
import { getRndNumber } from '../../common/common';
import { CONFIG } from '../../config/config';
import { GACHA_LIST } from '../../constant/gacha/gachaList';
import { GachaRepository } from '../../model/repository/gachaRepository';
import { UsersRepository } from '../../model/repository/usersRepository';
import * as Models from '../../model/models';
import { ItemRepository } from '../../model/repository/itemRepository';
import { ICON } from '../../constant/constants';

function getWeight(list: Models.Item[]): Models.Item[] {
    const weightList = [];

    for (const gacha of list) {
        for (let i = 0; i < gacha.weight; i++) {
            weightList.push(gacha);
        }
    }

    return weightList;
}

/**
 * ランダムにガチャを一度引く
 * @returns
 */
export async function getGachaOnce(): Promise<Gacha> {
    const repository = new ItemRepository();
    const rnd = Math.random();

    if (rnd < 0.00002988) {
        const gachaList = await repository.get('UUR');
        const weightList = getWeight(gachaList);

        const index = getRndNumber(1, weightList.length) - 1;
        return {
            item_id: weightList[index].id,
            name: weightList[index].name,
            icon: weightList[index].icon,
            rare: weightList[index].rare,
            rank: weightList[index].item_rank.rank,
            is_present: weightList[index].is_present === 1,
            reroll: weightList[index].reroll
        };
    } else if (rnd < 0.000137) {
        const gachaList = await repository.get('UR');
        const weightList = getWeight(gachaList);

        const index = getRndNumber(1, weightList.length) - 1;
        return {
            item_id: weightList[index].id,
            name: weightList[index].name,
            icon: weightList[index].icon,
            rare: weightList[index].rare,
            rank: weightList[index].item_rank.rank,
            is_present: weightList[index].is_present === 1,
            reroll: weightList[index].reroll
        };
    } else if (rnd < 0.00866) {
        const gachaList = await repository.get('SSR');
        const weightList = getWeight(gachaList);

        const index = getRndNumber(1, weightList.length) - 1;

        return {
            item_id: weightList[index].id,
            name: weightList[index].name,
            icon: weightList[index].icon,
            rare: weightList[index].rare,
            rank: weightList[index].item_rank.rank,
            is_present: weightList[index].is_present === 1,
            reroll: weightList[index].reroll
        };
    } else if (rnd < 0.08928) {
        const gachaList = await repository.get('SR');
        const weightList = getWeight(gachaList);

        const index = getRndNumber(1, weightList.length) - 1;

        return {
            item_id: weightList[index].id,
            name: weightList[index].name,
            icon: weightList[index].icon,
            rare: weightList[index].rare,
            rank: weightList[index].item_rank.rank,
            is_present: weightList[index].is_present === 1,
            reroll: weightList[index].reroll
        };
    } else if (rnd < 0.658) {
        const gachaList = await repository.get('R');
        const weightList = getWeight(gachaList);
        const index = getRndNumber(1, weightList.length) - 1;

        return {
            item_id: weightList[index].id,
            name: weightList[index].name,
            icon: weightList[index].icon,
            rare: weightList[index].rare,
            rank: weightList[index].item_rank.rank,
            is_present: weightList[index].is_present === 1,
            reroll: weightList[index].reroll
        };
    } else if (rnd < 0.8889) {
        const gachaList = await repository.get('UC');
        const weightList = getWeight(gachaList);

        const index = getRndNumber(1, weightList.length) - 1;

        return {
            item_id: weightList[index].id,
            name: weightList[index].name,
            icon: weightList[index].icon,
            rare: weightList[index].rare,
            rank: weightList[index].item_rank.rank,
            is_present: weightList[index].is_present === 1,
            reroll: weightList[index].reroll
        };
    } else {
        const gachaList = await repository.get('C');
        const weightList = getWeight(gachaList);

        const index = getRndNumber(1, weightList.length) - 1;

        return {
            item_id: weightList[index].id,
            name: weightList[index].name,
            icon: weightList[index].icon,
            rare: weightList[index].rare,
            rank: weightList[index].item_rank.rank,
            is_present: weightList[index].is_present === 1,
            reroll: weightList[index].reroll
        };
    }
}

/**
 * ガチャを引く
 * @param message 受け取ったメッセージング情報
 * @param args 0: 指定回数 or 等級 (出るまで引く)
 * @returns
 */
export async function pickGacha(message: Message, args?: string[]) {
    if (args != undefined && args.length > 0) {
        pickExtra(message, args);
    } else {
        pickNormal(message);
    }
}

/**
 * 指定された条件でガチャを引く
 * @param message
 * @param args
 * @returns
 */
async function pickExtra(message: Message, args: string[]) {
    const gachaList: Gacha[] = [];

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
                content: `${user?.user_name ? user.user_name : user.id} さんのガチャフラグをリセットしたよ～！`
            });
        }
        return;
    }

    const num = Number(args[0]);
    if (num) {
        for (let i = 0; i < num; i++) {
            const gacha = await getGachaOnce();
            gachaList.push(gacha);
        }
    } else {
        do {
            const gacha = await getGachaOnce();
            gachaList.push(gacha);
            if (gacha.rare === args[0].toUpperCase()) {
                if (gacha.reroll === 0) {
                    break;
                }
            }
            if (
                gacha.name.includes(args[0]) &&
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
        .setDescription(`${highTier.map((g) => `[${g.rare}]${g.icon ? g.icon : ''} ${g.name}`).join('\n')}`)
        .setFields(fields)
        .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png');

    message.reply({ content: `ガチャを${gachaList.length}回ひいたよ！(_**景品無効**_)`, embeds: [send] });
}

/**
 * 通常ガチャを引く
 * @param message
 * @returns
 */
async function pickNormal(message: Message) {
    const gachaList = [];

    const users = new UsersRepository();
    const user = await users.get(message.author.id);

    if (user) {
        if (user.last_pick_date) {
            if (user.last_pick_date >= dayjs().hour(0).minute(0).second(0).toDate()) {
                const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`ガチャ抽選済`);

                message.reply({ content: `もう抽選してるみたい！2回目はだめだよ！`, embeds: [send] });
                return;
            }
        }
    } else {
        await users.save({ id: message.author.id, user_name: message.author.tag });
    }

    for (let i = 0; i < 10; i++) {
        const gacha = await getGachaOnce();
        gachaList.push(gacha);
    }

    // 10連チケットを引いた分だけ加算する
    let ticketRolls = gachaList
        .filter((g) => g.reroll > 0)
        .reduce(function (sum, element) {
            return sum + element.reroll;
        }, 0);

    do {
        let tempList = 0;
        if (ticketRolls > 0) {
            for (let i = 0; i < ticketRolls; i++) {
                const gacha = await getGachaOnce();
                gachaList.push(gacha);
                if (gacha.reroll > 0) {
                    tempList += gacha.reroll;
                }
            }
            ticketRolls = tempList;
        } else {
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
            item_id: g.item_id,
            pick_date: nowTime,
            rare: g.rare,
            rank: g.rank,
            is_used: 0
        };
    });

    await gachaTable.save(createTables);

    const itemRepository = new ItemRepository();
    const items = await itemRepository.getAll();

    await users.save({
        id: message.author.id,
        user_name: message.author.tag,
        last_pick_date: dayjs().toDate()
    });
    const presents = t.filter((g) => items.find((i) => i.id === g.item_id)?.is_present === 1);
    const desc = t.map((g) => `[${g.rare}]${g.icon ? g.icon : ''} ${g.name}`).join('\n');

    if (t.length > 99) {
        const send = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(`${gachaList.length}連の結果: 高い順に50要素のみ抜き出しています`)
            .setDescription(`${highTier.map((g) => `[${g.rare}]${g.icon ? g.icon : ''} ${g.name}`).join('\n')}`)
            .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png');
        message.reply({ content: `ガチャだよ！からんころーん！(景品は一日の最初の一回のみです)`, embeds: [send] });
        if (presents.length > 0) {
            const send = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('プレゼントだ～！おめでと～！！')
                .setDescription(presents.map((p) => `[${p.rare}] ${p.name}`).join('\n'))
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
                .setDescription(presents.map((p) => `[${p.rare}] ${p.name}`).join('\n'))
                .setFields({ name: '通知用:', value: '<@246007305156558848>' });
            message.channel.send({ embeds: [send] });
        }
    }
}

/**
 * FIXME: 未実装
 * @param message
 */
export async function getPresent(message: Message) {
    const gachaRepository = new GachaRepository();
    const gachaList = await gachaRepository.getPresents(message.author.id);

    if (gachaList.length > 0) {
        const presents: { gacha: Models.Gacha; count: number }[] = [];

        gachaList.map((g) => {
            const p = presents.find((p) => p.gacha.item_id === g.item_id);
            if (p != undefined) {
                p.count++;
            } else {
                presents.push({ gacha: g, count: 1 });
            }
        });

        const send = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('当選したプレゼント一覧')
            .setDescription('')
            .setFields();
        message.channel.send({ embeds: [send] });
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
    item_id: number;
    name: string;
    icon: string | null;
    rare: string;
    rank: number;
    is_present: boolean;
    reroll: number;
}

export interface Omikuji {
    luck: string;
    description: string;
}
