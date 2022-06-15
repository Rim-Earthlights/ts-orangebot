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
        message.reply(
            '[みかんちゃん/TS] どう振っていいのかわかんない！！\n(例: [.dice 5 6] 6面体ダイスを5回振る のように指定してね)'
        );
        return;
    }

    const diceNum = Number(args[0]);
    const diceMax = Number(args[1]);

    if (diceNum <= 0 || diceMax <= 0) {
        message.reply('[みかんちゃん/TS] いじわる！きらい！\n(数字に0以下はだめだよ)');
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
        });

    message.reply({ content: `${diceMax}面ダイスを${diceNum}個ね！まかせて！`, embeds: [send] });
}

/**
 * 乱数生成機
 * n-mまでの整数を出力する.
 * @param n 最小値
 * @param m 最大値
 */
function getRndNumber(n: number, m: number) {
    return Math.floor(Math.random() * (m + 1 - n)) + n;
}
