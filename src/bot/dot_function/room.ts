/**
 * お部屋関連処理
 */

import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import { getRndArray } from '../../common/common.js';

export async function initRoom(): Promise<void> {
    return;
}

/**
 * お部屋の名前を変更する
 * @param message Message
 * @param roomName 変更後のお部屋名
 */
export async function changeRoomName(message: Message, roomName: string): Promise<void> {
    if (message.channel.type === ChannelType.GuildStageVoice) {
        return;
    }

    if (message.channel.type === ChannelType.DM) {
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
export async function team(message: Message, num: number, move: boolean): Promise<void> {
    if (message.channel.type === ChannelType.GuildStageVoice) {
        return;
    }

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

    const teams: { team: number; id: string; name: string | undefined }[] = [];

    for (let i = 0; i < shuffleMembers.length; i++) {
        teams.push({
            team: i % num,
            id: shuffleMembers[i],
            name: vc.members.find((m) => m.id === shuffleMembers[i])?.user.username
        });
    }

    // 部屋の作成
    const parent = vc.parent;
    if (!parent) {
        await message.reply('親カテゴリが見つからないよ！');
        return;
    }

    const t: { team: number; names: string[] }[] = [];
    teams.map((team) => {
        if (team.name != undefined) {
            if (t[team.team] === undefined) {
                t[team.team] = { team: team.team, names: [team.name] };
            } else {
                t[team.team].names.push(team.name);
            }
        }
    });
    const fields = t.map((team) => {
        return {
            name: `チーム${team.team + 1}`,
            value: team.names.join('\n')
        };
    });

    const send = new EmbedBuilder().setColor('#00ff55').setTitle(`チーム分け結果`).setFields(fields);

    message.reply({ embeds: [send] });

    if (move) {
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
}
