import dayjs from 'dayjs';
import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import { GachaRepository } from '../../model/repository/gachaRepository.js';
import { UsersRepository } from '../../model/repository/usersRepository.js';
import { ItemRepository } from '../../model/repository/itemRepository.js';
import { DISCORD_CLIENT } from '../../constant/constants.js';
import { getGachaOnce } from '../function/gacha.js';
import { Gacha, GachaPercents, Omikuji } from '../../constant/gacha/gacha.js';
import { checkUserType } from '../../common/common.js';
import { UsersType } from '../../model/models/users.js';
import { Logger } from '../../common/logger.js';
import { LogLevel } from '../../type/types.js';
import { CONFIG } from '../../config/config.js';

/**
 * ガチャを引く
 * @param message 受け取ったメッセージング情報
 * @param args 0: 指定回数 or 等級 (出るまで引く)
 * @returns
 */
export async function pickGacha(message: Message, args?: string[]) {
    if (args != undefined && args.length > 0) {
        if (args[0] === 'list') {
            await getPresent(message, args[1], false);
        } else if (args[0] === 'hist') {
            await getPresent(message, args[1], true);
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
    if (!checkUserType(message.author.id, UsersType.OWNER)) {
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
    fields.push({ name: '当たり数', value: gachaList.filter((g) => g.is_present).length.toString() });
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
        await users.save({ id: message.author.id, user_name: message.author.username, pick_left: 10 });
        num = 10;
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
        user_name: message.author.username,
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
            await Logger.put({
                guild_id: message.guild?.id,
                channel_id: message.channel.id,
                user_id: message.id,
                level: LogLevel.INFO,
                event: 'get-gacha',
                message: [`user: ${message.author.username}`, ...presents.map((p) => `[${p.rare}] ${p.name}`)]
            });
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
            await Logger.put({
                guild_id: message.guild?.id,
                channel_id: message.channel.id,
                user_id: message.id,
                level: LogLevel.INFO,
                event: 'get-gacha',
                message: [`user: ${message.author.username}`, ...presents.map((p) => `[${p.rare}] ${p.name}`)]
            });
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
export async function getPresent(message: Message, uid?: string, hist?: boolean) {
    let getUid: string;
    if (message.channel.type === ChannelType.GuildStageVoice) {
        return;
    }
    if (uid == undefined) {
        getUid = message.author.id;
    } else {
        if (!checkUserType(message.author.id, UsersType.OWNER)) {
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
    const gachaList = await gachaRepository.getPresents(getUid, hist ?? false);
    const list = gachaList.map((p) => {
        return `${p.id}: [${p.items.rare}]${p.items.icon ? p.items.icon : ''} ${p.items.name} ${
            p.is_used ? '(**使用済み**)' : ''
        }`;
    });

    if (pickLeft != undefined) {
        const presentDescription = list.join('\n');
        const money = gachaList.reduce((prev, current) => {
            return prev + current.items.price;
        }, 0);
        const send = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(`${user?.user_name} さんのガチャ情報だよ！`)
            .setDescription(
                `${CONFIG.COMMON.HOST_URL}:${CONFIG.COMMON.PORT}/gacha/history?uid=${getUid}&hist=${hist ?? false}`
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
    if (!checkUserType(message.author.id, UsersType.OWNER)) {
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
                    `ユーザ: ${(await DISCORD_CLIENT.users.fetch(result.user_id)).username}\nプレゼント: ${
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
    if (!checkUserType(message.author.id, UsersType.OWNER)) {
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
            .setDescription(
                `ユーザ: ${(await DISCORD_CLIENT.users.fetch(uid)).username}\nプレゼント: ${result.items.name}`
            );

        await message.reply({
            embeds: [send]
        });
    } else {
        await message.reply({
            content: `プレゼントが見つからないよ！`
        });
    }
}

export const showPercent = async (message: Message) => {
    const fields = [];
    fields.push({ name: 'UUR', value: `${GachaPercents.UUR * 100} %` });
    fields.push({ name: 'UR', value: `${GachaPercents.UR * 100 - GachaPercents.UUR * 100} %` });
    fields.push({
        name: 'SSR',
        value: `${(GachaPercents.SSR * 100 - GachaPercents.UR * 100).toFixed(4)} %`
    });
    fields.push({
        name: 'SR',
        value: `${(GachaPercents.SR * 100 - GachaPercents.SSR * 100).toFixed(4)} %`
    });
    fields.push({
        name: 'R',
        value: `${(GachaPercents.R * 100 - GachaPercents.SR * 100).toFixed(4)} %`
    });
    fields.push({
        name: 'UC',
        value: `${(GachaPercents.UC * 100 - GachaPercents.R * 100).toFixed(4)} %`
    });
    fields.push({
        name: 'C',
        value: `${(GachaPercents.C * 100 - GachaPercents.UC * 100).toFixed(4)} %`
    });

    const send = new EmbedBuilder().setColor('#ff9900').setTitle('現在の確率一覧だよ！').setFields(fields);

    await message.reply({
        embeds: [send]
    });
};

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
