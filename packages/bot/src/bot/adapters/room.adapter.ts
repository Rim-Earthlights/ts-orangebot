/**
 * ルーム機能の Discord アダプター
 * ルームの DB 状態管理・チーム分けロジックは @orangebot/shared の RoomService が担当し、
 * ここでは Discord (Message / VoiceChannel) との橋渡しと Embed 整形を行う (Phase 2-3)
 */
import {
  BaseGuildVoiceChannel,
  ChannelType,
  Collection,
  EmbedBuilder,
  Message,
  PermissionsBitField,
  User,
  VoiceChannel
} from 'discord.js';
import { RoomService } from '@orangebot/shared';

const teamName = ['赤', '青', '黄', '緑', '紫', '桃', '茶', '白', 'アタッカー', 'ディフェンダー'];

/**
 * お部屋の名前を変更する
 * @param message Message
 * @param roomName 変更後のお部屋名
 */
export async function changeRoomName(message: Message, roomName: string): Promise<void> {
  if (message.channel.type === ChannelType.GuildStageVoice) {
    return;
  }

  if (message.channel.type !== ChannelType.GuildVoice) {
    if (message.channel.type === ChannelType.GroupDM) {
      return;
    }
    await message.channel.send('DM内では使えない機能だよ！');
    return;
  }

  const roomService = new RoomService();
  const roomInfo = await roomService.renameRoom(message.channel.id, roomName);

  if (!roomInfo) {
    return;
  }

  if (roomInfo.is_live) {
    roomName = '[🔴配信] ' + roomName;
  }

  await message.channel.setName(roomName, '部屋名変更: ' + message.author.displayName);
  message.reply(`お部屋の名前を${roomName}に変更したよ！`);
}

/**
 * お部屋の設定を変更する
 * @param message
 * @param mode
 * @returns
 */
export async function changeRoomSetting(message: Message, mode: 'delete' | 'live', value?: string): Promise<void> {
  if (message.channel.type !== ChannelType.GuildVoice) {
    if (message.channel.type === ChannelType.GroupDM) {
      return;
    }
    await message.channel.send('DM内では使えない機能だよ！');
    return;
  }

  const roomService = new RoomService();

  switch (mode) {
    case 'delete': {
      const isAutodelete = await roomService.toggleAutoDelete(message.channel.id);
      if (isAutodelete === null) {
        return;
      }
      if (isAutodelete) {
        await message.reply('自動削除フラグをつけたよ！');
      } else {
        await message.reply('自動削除フラグを外したよ！');
      }
      break;
    }
    case 'live': {
      if (!value) {
        return;
      }
      const room = await roomService.toggleLive(message.channel.id, value);
      if (!room) {
        return;
      }
      if (room.is_live) {
        await message.channel.setName('[L] ' + value, '部屋名変更: ' + message.author.displayName);
        await message.reply('配信フラグをつけたよ！');
      } else {
        await message.channel.setName(value.replace('[L] ', ''), '部屋名変更: ' + message.author.displayName);
        await message.reply('配信フラグを外したよ！');
      }
      break;
    }
  }
}

export async function updateRoomSettings(channel: VoiceChannel, users: User[]) {
  const permission = channel.permissionOverwrites.cache;

  for (const user of users) {
    const p = permission.find((p) => p.id === user.id);
    if (p) {
      p.allow.has(PermissionsBitField.Flags.ViewChannel)
        ? p.allow.remove([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect])
        : p.allow.add([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect]);
    }
  }
  return;
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
    if (message.channel.type === ChannelType.GroupDM) {
      return;
    }
    await message.channel.send('DM内では使えない機能だよ！');
    return;
  }

  if (!message.member?.voice.channel) {
    if (message.channel.type === ChannelType.GroupDM) {
      return;
    }
    await message.channel.send('ボイスチャンネルに接続していないよ！');
    return;
  }
  const vc = message.member?.voice.channel;

  if (vc.members.size < num) {
    await message.reply('チーム数がメンバー数より多いよ！');
    return;
  }

  const members = vc.members
    .filter((m) => !m.user.bot)
    .map((m) => ({ id: m.id, name: m.displayName }));
  const teams = RoomService.splitTeams(members, num);

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
      value: team.names.join('\n'),
    };
  });

  const send = new EmbedBuilder().setColor('#00ff55').setTitle(`チーム分け結果`).setFields(fields);

  message.reply({ embeds: [send] });

  if (move) {
    for (let i = 0; i < num; i++) {
      const createVc = await vc.guild.channels.create({
        name: `チーム${i + 1}`,
        type: ChannelType.GuildVoice,
        parent: parent,
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
export async function createTeamRoom(message: Message, team: number, limit: number) {
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

  const t = Number.isNaN(team) ? 2 : team > 8 ? 8 : team;
  const l = Number.isNaN(limit) ? 10 : limit;

  const vcList = message.guild.channels.cache.filter(
    (c) => c.type === ChannelType.GuildVoice && c.parentId === parentId
  );
  if (vcList.find((v) => v.name === '赤')) {
    await message.channel.send('既に部屋が作成されているよ！');
    return;
  }

  const roomService = new RoomService();

  for (let i = 0; i < t; i++) {
    const vc = await message.guild.channels.create({
      name: teamName[i],
      type: ChannelType.GuildVoice,
      userLimit: l,
      parent: parentId,
    });
    await roomService.registerRoom({
      roomId: vc.id,
      guildId: vc.guild.id,
      name: vc.name,
      isAutodelete: false,
      isLive: false,
      isPrivate: false,
    });
  }

  await message.channel.send('部屋を作成したよ！');
}

/**
 * カスタム用の部屋を削除する
 * @param message
 * @returns
 */
export async function deleteTeamRoom(message: Message, force: boolean) {
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
    .filter((c) => teamName.includes(c.name)) as Collection<string, BaseGuildVoiceChannel>;

  if (!force) {
    if (vcList.find((c) => c.members.size > 0)) {
      await message.channel.send('部屋に人がいるよ！');
      return;
    }
  }

  await Promise.all(
    vcList.map(async (c) => {
      const vc = c as BaseGuildVoiceChannel;
      const roomService = new RoomService();
      await roomService.unregisterRoom(vc.id);
      await vc.delete();
    })
  );

  await message.channel.send('部屋を削除したよ！');
  return;
}
