import { BaseGuildVoiceChannel, ChannelType, Collection, EmbedBuilder, Message } from 'discord.js';
import { getRndArray } from '../../common/common.js';
import { RoomRepository } from '../../model/repository/roomRepository.js';
import { getDefaultRoomName } from './voice.js';

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

    const roomRepository = new RoomRepository();
    const roomInfo = await roomRepository.getRoom(vc.id);

    if (!roomInfo) {
        return;
    }

    await roomRepository.updateRoom(vc.id, { name: roomName });

    if (roomInfo.is_live) {
        roomName = '[🔴配信] ' + roomName;
    }

    await vc.setName(roomName, '部屋名変更: ' + message.author.displayName);
    message.reply(`お部屋の名前を${roomName}に変更したよ！`);
}

/**
 * お部屋の設定を変更する
 * @param message
 * @param mode
 * @returns
 */
export async function changeRoomSetting(
    message: Message,
    mode: 'delete' | 'live' | 'private',
    value?: string
): Promise<void> {
    const roomRepository = new RoomRepository();
    const roomInfo = await roomRepository.getRoom(message.channel.id);

    if (!roomInfo) {
        return;
    }

    switch (mode) {
        case 'delete': {
            if (roomInfo.is_autodelete) {
                roomInfo.is_autodelete = false;
                await message.reply('自動削除フラグを外したよ！');
            } else {
                roomInfo.is_autodelete = true;
                await message.reply('自動削除フラグをつけたよ！');
            }

            break;
        }
        case 'live': {
            if (roomInfo.is_live) {
                roomInfo.is_live = false;
                const vc = message.member?.voice.channel;
                if (vc) {
                    roomInfo.name = value!.replace('[🔴] ', '');
                    await vc.setName(value!.replace('[🔴] ', ''), '部屋名変更: ' + message.author.displayName);
                }
                await message.reply('配信フラグを外したよ！');
            } else {
                roomInfo.is_live = true;
                const vc = message.member?.voice.channel;
                if (vc) {
                    roomInfo.name = value!.replace('[🔴] ', '');
                    await vc.setName('[🔴] ' + value, '部屋名変更: ' + message.author.displayName);
                }
                await message.reply('配信フラグをつけたよ！');
            }
            break;
        }
        case 'private': {
            roomInfo.is_private = !roomInfo.is_private;
            const vc = message.member?.voice.channel;
            if (vc) {
                await vc.setName('[🅿] ' + vc.name, '部屋名変更: ' + message.author.displayName);
            }
            await message.reply('プライベートフラグをつけたよ！<未実装>');
            break;
        }
    }

    await roomRepository.updateRoom(message.channel.id, roomInfo);
}

export async function createRoom(
    message: Message,
    id: string,
    roomName?: string,
    isDelete?: boolean,
    limit?: number
): Promise<void> {
    if (!message.guild) {
        return;
    }
    if (message.channel.type === ChannelType.GuildStageVoice) {
        return;
    }
    if (message.channel.type === ChannelType.DM) {
        await message.channel.send('DM内では使えない機能だよ！');
    }

    const vc = await message.guild.channels.create({
        name: roomName ?? getDefaultRoomName(message.guild),
        type: ChannelType.GuildVoice,
        parent: id
    });

    if (limit) {
        await vc.setUserLimit(limit);
    }

    const room = new RoomRepository();
    await room.createRoom({
        room_id: vc.id,
        guild_id: vc.guild.id,
        name: vc.name,
        is_autodelete: isDelete,
        is_live: false,
        is_private: false
    });
}
/**
 * お部屋の人数制限を設定する
 * @param message
 * @param limit
 */
export async function changeLimit(message: Message, limit: number): Promise<void> {
    const vc = message.member?.voice.channel;
    if (vc) {
        await vc.setUserLimit(limit);
    }
    await message.reply('人数制限を変更したよ！');
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

    const members = vc.members.filter((m) => !m.user.bot).map((m) => m.id);
    const rnd = getRndArray(members.length);
    const shuffleMembers = members.map((m, i) => members[rnd[i]]);

    const teams: { team: number; id: string; name: string | undefined }[] = [];

    for (let i = 0; i < shuffleMembers.length; i++) {
        teams.push({
            team: i % num,
            id: shuffleMembers[i],
            name: vc.members.find((m) => m.id === shuffleMembers[i])?.displayName
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

/**
 * カスタム用の部屋を作成する
 * @param message
 * @returns
 */
export async function createTeamRoom(message: Message) {
    if (!message.guild) {
        return;
    }
    if (message.channel.type === ChannelType.DM) {
        await message.channel.send('DM内では使えない機能だよ！');
    }
    if (message.channel.type !== ChannelType.GuildVoice) {
        return;
    }
    const parentId = message.channel.parentId;

    if (!parentId) {
        return;
    }

    const vcList = message.guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice && c.parentId === parentId);
    if (vcList.find(v => v.name === 'アタッカー') && vcList.find(v => v.name === 'ディフェンダー')) {
        await message.channel.send('既に部屋が作成されているよ！');
        return;
    }
    const vc1 = await message.guild.channels.create({
        name: 'アタッカー',
        type: ChannelType.GuildVoice,
        parent: parentId
    });
    const vc2 = await message.guild.channels.create({
        name: 'ディフェンダー',
        type: ChannelType.GuildVoice,
        parent: parentId
    });

    const room = new RoomRepository();
    await room.createRoom({
        room_id: vc1.id,
        guild_id: vc1.guild.id,
        name: vc1.name,
        is_autodelete: false,
        is_live: false,
        is_private: false
    });
    await room.createRoom({
        room_id: vc2.id,
        guild_id: vc2.guild.id,
        name: vc2.name,
        is_autodelete: false,
        is_live: false,
        is_private: false
    });

    await message.channel.send('部屋を作成したよ！');
}

/**
 * カスタム用の部屋を削除する
 * @param message
 * @returns
 */
export async function deleteTeamRoom(message: Message) {
    if (!message.guild) {
        return;
    }
    if (message.channel.type === ChannelType.DM) {
        await message.channel.send('DM内では使えない機能だよ！');
    }
    if (message.channel.type !== ChannelType.GuildVoice) {
        return;
    }
    const parentId = message.channel.parentId;

    if (!parentId) {
        return;
    }

    const vcList = message.guild.channels.cache
        .filter((c) => c.type === ChannelType.GuildVoice && c.parentId === parentId)
        .filter((c) => c.name === 'アタッカー' || c.name === 'ディフェンダー') as Collection<string, BaseGuildVoiceChannel>;

    if (vcList.find((c) => c.members.size > 0)) {
        await message.channel.send('部屋に人がいるよ！');
        return;
    }

    await Promise.all(vcList.map(async (c) => {
        const vc = c as BaseGuildVoiceChannel;
        const room = new RoomRepository();
        await room.deleteRoom(vc.id);
        await vc.delete();
    }));

    await message.channel.send('部屋を削除したよ！');
    return;
}