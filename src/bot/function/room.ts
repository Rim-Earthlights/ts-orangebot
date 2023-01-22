/**
 * お部屋関連処理
 */

import { ChannelType, Message } from 'discord.js';
import { getRndArray } from '../../common/common';

export async function initRoom(): Promise<void> {
    return;
}

/**
 * お部屋の名前を変更する
 * @param message Message
 * @param roomName 変更後のお部屋名
 */
export async function changeRoomName(message: Message, roomName: string): Promise<void> {
    if (!message.guild) {
        await message.channel.send('DM内では使えない機能だよ！');
        return;
    }

    if (!message.member?.voice.channel) {
        await message.channel.send('ボイスチャンネルに接続していないよ！');
        return;
    }
    const vc = message.member?.voice.channel;

    await vc.setName(roomName, '部屋名変更: ' + message.author.tag);

    message.reply(`お部屋の名前を${roomName}に変更したよ！`);
}

/**
 * チーム分けを行う
 * @param message
 * @param num チーム数
 */
export async function team(message: Message, num: number): Promise<void> {
    if (!message.guild) {
        await message.channel.send('DM内では使えない機能だよ！');
        return;
    }

    if (!message.member?.voice.channel) {
        await message.channel.send('ボイスチャンネルに接続していないよ！');
        return;
    }
    const vc = message.member?.voice.channel;

    if (vc.members.size < num) {
        await message.reply('チーム数がメンバー数より多いよ！');
        return;
    }

    const members = vc.members.map((m) => m.id);
    const rnd = getRndArray(members.length - 1);
    const shuffleMembers = members.map((m, i) => members[rnd[i]]);

    const teams: { team: number; id: string }[] = [];

    for (let i = 0; i < shuffleMembers.length; i++) {
        teams.push({ team: i % num, id: shuffleMembers[i] });
    }

    // 部屋の作成
    const parent = vc.parent;
    if (!parent) {
        await message.reply('親カテゴリが見つからないよ！');
        return;
    }

    // ユーザを部屋に移動
    for (let i = 0; i < num; i++) {
        const createVc = await vc.guild.channels.create({
            name: `チーム${i + 1}`,
            type: ChannelType.GuildVoice,
            parent: parent
        });
        const team = teams.filter((t) => t.team === i);
        for (const t of team) {
            const member = await vc.guild.members.fetch(t.id);
            await member.voice.setChannel(createVc);
        }
    }
}
