import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import { arrayEquals, getRndNumber } from '../../common/common.js';
import { DiceRole, DICE_ROLE } from '../../constant/dice/dice.js';

/**
 * サイコロを振る
 * @param message
 * @param args 0: x回振る 1: x面体
 * @returns
 */
export async function roll(message: Message, args?: string[]) {
    if (args == undefined || args.length < 2) {
        const send = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('失敗')
            .setDescription('[.dice 5 6] 6面体ダイスを5回振る のように指定してね');

        message.reply({ content: `どう振っていいのかわかんない！！`, embeds: [send] });
        return;
    }

    const diceNum = Number(args[0]);
    const diceMax = Number(args[1]);

    if (diceNum <= 0 || diceMax <= 0) {
        const send = new EmbedBuilder().setColor('#ff0000').setTitle('失敗').setDescription('ダイスの数が0以下です');

        message.reply({ content: `いじわる！きらい！`, embeds: [send] });
        return;
    }

    if (diceNum >= 1000) {
        const send = new EmbedBuilder().setColor('#ff0000').setTitle('失敗').setDescription('ダイスの数が多すぎます');

        message.reply({ content: `一度にそんなに振れないよ～……`, embeds: [send] });
        return;
    }

    const result = [];
    for (let i = 0; i < diceNum; i++) {
        result.push(getRndNumber(1, diceMax));
    }

    const diceResult = result.join(', ');
    if (diceResult.length >= 4096) {
        const send = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('失敗')
            .setDescription('4096文字以上の文字の送信に失敗');

        message.reply({ content: `振らせすぎ！もうちょっと少なくして～！`, embeds: [send] });
        return;
    }

    const send = new EmbedBuilder()
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
 * 全員で100面ダイスを振る
 * @param message
 * @returns
 */
export async function rollAll(message: Message): Promise<void> {
    if (message.channel.type === ChannelType.GuildVoice || message.channel.type === ChannelType.GuildStageVoice) {
        const result: { displayName: string; rnd: number }[] = [];
        message.channel.members.map((m) => {
            result.push({ displayName: m.displayName, rnd: getRndNumber(1, 100) });
        });

        result.sort((a, b) => b.rnd - a.rnd);

        const send = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`結果:`)
            .setDescription(
                result
                    .map((r) => {
                        return `${r.displayName}: ${r.rnd}`;
                    })
                    .join('\n')
            )
            .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/dice.jpg');
        message.reply({ embeds: [send] });
    } else {
        const send = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('失敗')
            .setDescription('ユーザーリストが取得できない');

        message.reply({ content: `ボイスチャンネルで実行してね！`, embeds: [send] });
        return;
    }
}

/**
 * チンチロリンであそぶ
 * @param message
 */
export async function celo(message: Message) {
    const celo = getCelo(3);
    const description = [];

    const role = celo[celo.length - 1];

    for (let i = 0; i < celo.length; i++) {
        description.push(`${i + 1}: ${celo[i].role} / ${celo[i].dice.join(', ')}`);
    }

    const send = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`結果: ${role.role}`)
        .setDescription(description.join('\n'))
        .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/dice.jpg');

    message.reply({ content: `サイコロあそび！ちんちろりーん！`, embeds: [send] });
}

/**
 * チンチロリンで勝負する
 * @param message
 */
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
    const send = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`結果: ${title}`)
        .setDescription(description.join('\n'))
        .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/dice.jpg');

    message.reply({ content: `サイコロあそび！ちんちろりーん！\n${content}`, embeds: [send] });
}

/**
 * チンチロリンを振る 出た場合は回数未満でも終了する
 * @param n 回数
 */
export function getCelo(n: number): DiceRole[] {
    const celo = [];
    for (let i = 0; i < n; i++) {
        const temp = getRole();
        celo.push(temp);
        if (temp.rank > 0) {
            break;
        }
        if (temp.rank === DICE_ROLE.DICE_HIFUMI.rank) {
            break;
        }
    }

    return celo;
}

/**
 * チンチロリンを一度振る
 * @returns
 */
export function getRole(): DiceRole {
    const dice: number[] = [];
    for (let i = 0; i < 3; i++) {
        // ションベン
        const r = Math.random();
        if (r < 0.025) {
            return { ...DICE_ROLE.DICE_SHONBEN, dice: [-1, -1, -1] };
        }
        dice.push(getRndNumber(1, 6));
    }

    // ゾロ目判定
    if (dice.every((d) => d === dice[0])) {
        if (dice[0] === 1) {
            return { ...DICE_ROLE.DICE_PINZORO, dice };
        }
        const power = dice[0];
        const role = DICE_ROLE.DICE_ZORO.role.replace('%POWER%', power.toString());
        return { ...DICE_ROLE.DICE_ZORO, role, power, dice };
    }
    // ヒフミ, シゴロ
    if (arrayEquals(dice, [1, 2, 3])) {
        return { ...DICE_ROLE.DICE_HIFUMI, dice };
    }
    if (arrayEquals(dice, [4, 5, 6])) {
        return { ...DICE_ROLE.DICE_SHIGORO, dice };
    }
    dice.sort();

    // 3つの数字をソートして数字が被ってる場合は
    // 真ん中の数字を取ればどちらかと必ずかぶるはず
    if (dice[0] === dice[1] || dice[1] === dice[2]) {
        const power = dice.filter((d) => d !== dice[1])[0];
        const role = DICE_ROLE.DICE_POWER.role.replace('%POWER%', power.toString());
        return { ...DICE_ROLE.DICE_POWER, role, power, dice };
    }

    return { ...DICE_ROLE.DICE_MENASHI, dice };
}

/**
 * 出た目で勝負を判定する
 * @param t
 * @param v
 * @returns
 */
export function judge(t: DiceRole, v: DiceRole) {
    const rank = t.rank - v.rank;
    if (rank !== 0) {
        if (rank > 0) {
            return 1;
        }
        return -1;
    }
    if (t.power && v.power) {
        const power = t.power - v.power;
        if (power !== 0) {
            if (power > 0) {
                return 1;
            }
            return -1;
        }
    }
    return 0;
}

/**
 * アイテムをランダムに選ぶ
 * @param items
 */
export function choose(items: string[]) {
    const rnd = getRndNumber(0, items.length - 1);
    return items[rnd];
}
