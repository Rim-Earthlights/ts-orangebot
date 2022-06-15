import { Message, MessageEmbed } from 'discord.js';

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

export async function dice(message: Message, args?: string[]) {
    if (args == undefined || args.length < 2) {
        message.reply('どう振っていいのかわかんない！！\n(例: [.dice 5 6] 6面体ダイスを5回振る のように指定してね)');
        return;
    }

    const diceNum = Number(args[0]);
    const diceMax = Number(args[1]);

    if (diceNum <= 0 || diceMax <= 0) {
        message.reply('いじわる！きらい！\n(数字に0以下はだめだよ)');
        return;
    }

    const result = [];
    for (let i = 0; i < diceNum; i++) {
        result.push(getRndNumber(1, diceMax));
    }

    const send = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('サイコロ振ったよ～！')
        .setDescription(result.join(', '))
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
    console.log('Not Implements.');
    return;
}

/**
 * 今日の天気を返す.
 * @param message 受け取ったメッセージング情報
 */
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

/**
 * 乱数生成機
 * n-mまでの整数を出力する.
 * @param n 最小値
 * @param m 最大値
 */
export function getRndNumber(n: number, m: number) {
    return Math.floor(Math.random() * (m + 1 - n)) + n;
}
