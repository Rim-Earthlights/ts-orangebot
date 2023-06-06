/**
 * ガチャ関連処理
 * おみくじもここで処理している
 */

import dayjs from 'dayjs';
import { ChannelType, EmbedBuilder, Message, MessageType } from 'discord.js';
import { getRndNumber } from '../../common/common.js';
import { CONFIG } from '../../config/config.js';
import { GachaRepository } from '../../model/repository/gachaRepository.js';
import { UsersRepository } from '../../model/repository/usersRepository.js';
import * as Models from '../../model/models/index.js';
import { ItemRepository } from '../../model/repository/itemRepository.js';
import { DISCORD_CLIENT } from '../../constant/constants.js';
import * as Logger from '../../common/logger.js';

export class Gacha {
    static allItemList: Models.Item[] = [];
}

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
 * ランダムにガチャを一度引き、等級を返す
 * @returns
 */
export async function getGachaOnce(): Promise<Gacha> {
    const switchMultiplicationToDivision = (num: number) => {
        if (num === 0) {
            return Infinity;
        } else {
            return 1 / num;
        }
    };

    const rnd = Math.random() * switchMultiplicationToDivision(CONFIG.PICKRATE);

    console.log(rnd);

    if (rnd < 0.000044) {
        return await convertGacha('UUR');
    } else if (rnd < 0.000306) {
        return await convertGacha('UR');
    } else if (rnd < 0.00688) {
        return await convertGacha('SSR');
    } else if (rnd < 0.08928) {
        return await convertGacha('SR');
    } else if (rnd < 0.658) {
        return await convertGacha('R');
    } else if (rnd < 0.8889) {
        return await convertGacha('UC');
    } else {
        return await convertGacha('C');
    }
}

/**
 * 当選結果からランダムにガチャを引く
 * @param rare
 * @returns
 */
async function convertGacha(rare: string): Promise<Gacha> {
    const allItems = Gacha.allItemList;
    const itemList = allItems.filter((i) => i.rare === rare);
    const weightList = getWeight(itemList);

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

/**
 * ガチャを引く
 * @param message 受け取ったメッセージング情報
 * @param args 0: 指定回数 or 等級 (出るまで引く)
 * @returns
 */
export async function pickGacha(message: Message, args?: string[]) {
    if (args != undefined && args.length > 0) {
        if (args[0] === 'list') {
            await getPresent(message, args[1]);
        } else if (args[0] === 'use') {
            await usePresent(message, args.slice(1));
        } else if (args[0] === 'reset') {
            await reset(message, args[1], args[2]);
        } else if (args[0] === 'extra') {
            await pickExtra(message, args);
        } else {
            await pickNormal(message, args[0]);
        }
    } else {
        await pickNormal(message);
    }
}

/**
 * ガチャフラグをリセットする
 * @param message
 * @param id
 * @returns
 */
async function reset(message: Message, id?: string, num?: string) {
    if (!CONFIG.DISCORD.ADMIN_USER_ID.includes(message.author.id)) {
        await message.reply({
            content: `ガチャフラグのリセット権限がないアカウントだよ！管理者にお願いしてね！`
        });
        return;
    }
    if (id) {
        const users = new UsersRepository();
        const user = await users.get(id);
        if (!user) {
            await message.reply({
                content: `リセットしようとするユーザが登録されてないみたい…？`
            });
            return;
        }
        if (num) {
            await users.resetGacha(id, Number(num));
            await message.reply({
                content: `${user?.user_name ? user.user_name : user.id} さんのガチャ回数を${num}に再セットしたよ！`
            });
            return;
        }
        await users.resetGacha(id, 10);
        await message.reply({
            content: `${user?.user_name ? user.user_name : user.id} さんのガチャ回数を10に再セットしたよ！`
        });
    }
    return;
}

/**
 * 指定された条件でガチャを引く
 * @param message
 * @param args
 * @returns
 */
async function pickExtra(message: Message, args: string[]) {
    const gachaList: Gacha[] = [];

    const num = Number(args[1]);
    if (num) {
        for (let i = 0; i < num; i++) {
            const gacha = await getGachaOnce();
            gachaList.push(gacha);
        }
    } else {
        do {
            const gacha = await getGachaOnce();
            gachaList.push(gacha);
            if (gacha.rare === args[1].toUpperCase()) {
                if (gacha.reroll === 0) {
                    break;
                }
            }
            if (
                gacha.name.includes(args[1]) &&
                !['C', 'UC', 'R', 'SR', 'SSR', 'UR', 'UUR'].find((r) => r === args[1].toUpperCase())
            ) {
                break;
            }
            if (gachaList.length > 1_000_000) {
                const send = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`エラー`)
                    .setDescription(`1,000,000回引いても該当の等級が出なかった`);

                await message.reply({ content: `ガチャ、出なかったみたい・・・`, embeds: [send] });
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

    await message.reply({ content: `ガチャを${gachaList.length}回ひいたよ！(_**景品無効**_)`, embeds: [send] });
}

/**
 * 通常ガチャを引く
 * @param message
 * @returns
 */
async function pickNormal(message: Message, gnum = '10') {
    if (message.channel.type === ChannelType.GuildStageVoice) {
        return;
    }

    let limitFlag = false;
    let num = 10;

    const gachaList = [];

    const users = new UsersRepository();
    const user = await users.get(message.author.id);

    if (gnum === 'limit' || gnum === 'l') {
        limitFlag = true;
        num = user?.pick_left ? user.pick_left : 1;
    } else {
        num = Number(gnum);
    }

    if (user) {
        if (user.pick_left < num) {
            const send = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`ガチャ回数不足`)
                .setFields({ name: '残り回数', value: user.pick_left.toString() });
            await message.reply({
                content: `ガチャを引く残り回数が足りないみたい！`,
                embeds: [send]
            });
            return;
        }
    } else {
        await users.save({ id: message.author.id, user_name: message.author.tag, pick_left: 10 });
    }

    for (let i = 0; i < num; i++) {
        const gacha = await getGachaOnce();
        gachaList.push(gacha);
    }

    // チケットを引いた分だけ加算する
    const ticketRolls = gachaList
        .filter((g) => g.reroll > 0)
        .reduce(function (sum, element) {
            return sum + element.reroll;
        }, 0);

    let totalRolls = ticketRolls;
    if (limitFlag) {
        let tickets = ticketRolls;

        do {
            let tempList = 0;
            if (tickets <= 0) {
                break;
            }
            for (let i = 0; i < tickets; i++) {
                const gacha = await getGachaOnce();
                gachaList.push(gacha);
                if (gacha.reroll > 0) {
                    tempList += gacha.reroll;
                }
            }
            tickets = tempList;
            totalRolls += tickets;
            // eslint-disable-next-line no-constant-condition
        } while (true);
    }

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
    let pickLeft = 0;
    if (!limitFlag) {
        pickLeft = (user ? user.pick_left : 10) - num + ticketRolls;
    }

    await users.save({
        id: message.author.id,
        user_name: message.author.tag,
        last_pick_date: dayjs().toDate(),
        pick_left: pickLeft
    });
    const presents = t.filter((g) => items.find((i) => i.id === g.item_id)?.is_present === 1);
    const desc = t.map((g) => `[${g.rare}]${g.icon ? g.icon : ''} ${g.name}`).join('\n');

    if (t.length > 99) {
        const send = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(`${gachaList.length}連の結果: 高い順に50要素のみ抜き出しています`)
            .setDescription(`${highTier.map((g) => `[${g.rare}]${g.icon ? g.icon : ''} ${g.name}`).join('\n')}`)
            .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png')
            .setFields(
                { name: 'チケット増加回数', value: totalRolls.toString() },
                { name: '残り回数', value: pickLeft.toString() }
            );
        await message.reply({ content: `ガチャだよ！からんころーん！`, embeds: [send] });
        if (presents.length > 0) {
            const send = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('プレゼントだ～！おめでと～！！')
                .setDescription(presents.map((p) => `[${p.rare}] ${p.name}`).join('\n'))
                .setFields({ name: '通知:', value: '<@246007305156558848>' });
            await message.channel.send({ embeds: [send] });
        }
    } else {
        const send = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(`${gachaList.length}連の結果`)
            .setDescription(`${desc}`)
            .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/gacha.png')
            .setFields(
                { name: 'チケット増加回数', value: totalRolls.toString() },
                { name: '残り回数', value: pickLeft.toString() }
            );
        await message.reply({ content: `ガチャだよ！からんころーん！`, embeds: [send] });
        if (presents.length > 0) {
            const send = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('プレゼントだ～！おめでと～！！')
                .setDescription(presents.map((p) => `[${p.rare}] ${p.name}`).join('\n'))
                .setFields({ name: '通知用:', value: '<@246007305156558848>' });
            await message.channel.send({ embeds: [send] });
        }
    }
}

/**
 * プレゼント一覧を取得する
 * @param message
 */
export async function getPresent(message: Message, uid?: string) {
    let getUid: string;
    if (message.channel.type === ChannelType.GuildStageVoice) {
        return;
    }
    if (uid == undefined) {
        getUid = message.author.id;
    } else {
        if (!CONFIG.DISCORD.ADMIN_USER_ID.includes(message.author.id)) {
            message.reply({
                content: `他ユーザーのプレゼントの閲覧権限がないよ！`
            });
            return;
        }
        getUid = uid;
    }
    const gachaRepository = new GachaRepository();
    const users = new UsersRepository();
    const user = await users.get(getUid);
    const pickLeft = user?.pick_left;
    const gachaList = await gachaRepository.getPresents(getUid);

    if (pickLeft != undefined) {
        const presentDescription = gachaList.map((p) => `${p.id}: [${p.items.rare}]${p.items.name}`).join('\n');
        const send = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(`${user?.user_name} さんのガチャ情報だよ！`)
            .setFields(
                { name: '当選したプレゼント', value: presentDescription ? presentDescription : 'なし' },
                { name: '残りガチャ回数', value: pickLeft.toString() }
            );
        await message.channel.send({ embeds: [send] });
    } else {
        await message.reply({
            content: `ユーザーが登録されていないみたい？ガチャを引いてみると解決するかも！`
        });
    }
}

/**
 * プレゼントを使用する
 *
 */
export async function usePresent(message: Message, args: string[]) {
    if (!CONFIG.DISCORD.ADMIN_USER_ID.includes(message.author.id)) {
        await message.reply({
            content: `プレゼントの使用権限がないよ！`
        });
        return;
    }

    const gachaRepository = new GachaRepository();
    args.map(async (arg) => {
        const result = await gachaRepository.usePresent(Number(arg));
        if (result) {
            const send = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('プレゼントを使用したよ！')
                .setDescription(
                    `ユーザ: ${(await DISCORD_CLIENT.users.fetch(result.user_id)).tag}\nプレゼント: ${
                        result.items.name
                    }`
                );

            await message.reply({
                embeds: [send]
            });
        } else {
            await message.reply({
                content: `id:${arg} のプレゼントが見つからないよ！`
            });
        }
    });
}

/**
 * プレゼントを渡す
 * @param message
 * @param uid
 * @param itemId
 * @returns
 */
export async function givePresent(message: Message, uid: string, itemId: number) {
    if (!CONFIG.DISCORD.ADMIN_USER_ID.includes(message.author.id)) {
        await message.reply({
            content: `プレゼントを渡す権限がないよ！`
        });
        return;
    }

    const gachaRepository = new GachaRepository();
    const result = await gachaRepository.givePresent(uid, itemId);
    if (result) {
        const send = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('プレゼントを渡したよ！')
            .setDescription(`ユーザ: ${(await DISCORD_CLIENT.users.fetch(uid)).tag}\nプレゼント: ${result.items.name}`);

        await message.reply({
            embeds: [send]
        });
    } else {
        await message.reply({
            content: `プレゼントが見つからないよ！`
        });
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

                await message.reply({ content: `おみくじ、出なかったみたい・・・`, embeds: [send] });
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

        await message.reply({ content: `おみくじ！がらがらがら～！`, embeds: [send] });
        return;
    } else {
        const omikuji = getOmikujiOnce();

        const send = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(omikuji.luck)
            .setDescription(omikuji.description)
            .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/mikuji.png');

        await message.reply({ content: `おみくじ！がらがらがら～！`, embeds: [send] });
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
