import {
  CacheType,
  CategoryChannel,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionsBitField,
  VoiceChannel,
} from 'discord.js';
import { GuildRepository } from '../../model/repository/guildRepository.js';
import { RoleRepository } from '../../model/repository/roleRepository.js';
import { RoomRepository } from '../../model/repository/roomRepository.js';
import { UsersRepository } from '../../model/repository/usersRepository.js';

/**
 * チャンネルを作成する
 * @param interaction 発行されたコマンド情報
 * @param name チャンネル名
 * @param isLive 配信フラグ
 * @param isPrivate プライベートフラグ
 */
export async function createRoom(
  interaction: ChatInputCommandInteraction<CacheType>,
  name: string,
  isLive: boolean,
  isPrivate: boolean
) {
  const guild = interaction.guild;
  if (!guild) {
    return;
  }

  const guildRepository = new GuildRepository();
  const guildInfo = await guildRepository.get(guild.id);
  if (!guildInfo) {
    return;
  }

  const lobby = guild.channels.cache.find((c) => c.name === guildInfo.lobby_name);

  if (!lobby) {
    return;
  }

  const parent = guild.channels.cache.find((c) => c.parentId != null && c.type === ChannelType.GuildVoice)
    ?.parent as CategoryChannel;

  if (!parent) {
    return;
  }

  const roleRepository = new RoleRepository();
  const roles = await roleRepository.getRoles(guild.id);

  const memberRole = roles.find((r) => r.name === 'member');
  const adminRole = roles.find((r) => r.name === 'admin');

  if (!memberRole || !adminRole) {
    return;
  }

  const vc = await guild.channels.create({
    name: `${isPrivate ? '[P]' : ''}${isLive ? '[L]' : ''} ${name}`,
    type: ChannelType.GuildVoice,
    bitrate: 96000,
    userLimit: 99,
    parent: parent,
    permissionOverwrites: [
      {
        id: memberRole.role_id,
        deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
      },
      {
        id: adminRole.role_id,
        deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
      },
      {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
      },
    ],
  });

  const room = new RoomRepository();
  await room.createRoom({
    room_id: vc.id,
    guild_id: vc.guild.id,
    name: vc.name,
    is_autodelete: true,
    is_live: isLive,
    is_private: isPrivate,
  });

  await interaction.editReply({ content: 'お部屋を作りました！' });
}

/**
 * チャンネルにユーザーを追加する
 * @param interaction 発行されたコマンド情報
 * @param user ユーザー
 */
export async function addPermission(interaction: ChatInputCommandInteraction<CacheType>, user: GuildMember) {
  const guild = interaction.guild;
  if (!guild) {
    return;
  }

  const userRepository = new UsersRepository();
  const userInfo = await userRepository.get(guild.id, user.id);
  if (userInfo?.type === 'owner') {
    await interaction.editReply({ content: 'owner権限は追加/削除できません' });
    return;
  }

  const roomRepository = new RoomRepository();
  const room = await roomRepository.getRoom(interaction.channelId);
  if (!room) {
    return;
  }

  const channel = interaction.channel as VoiceChannel;

  if (!channel) {
    return;
  }

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: true,
    Connect: true,
  });

  await interaction.editReply({ content: 'ユーザーを追加したよ！' });
}

/**
 * チャンネルにユーザーを追加する
 * @param interaction 発行されたコマンド情報
 * @param user ユーザー
 */
export async function removePermission(interaction: ChatInputCommandInteraction<CacheType>, user: GuildMember) {
  const guild = interaction.guild;
  if (!guild) {
    return;
  }

  const userRepository = new UsersRepository();
  const userInfo = await userRepository.get(guild.id, user.id);
  if (userInfo?.type === 'owner') {
    await interaction.editReply({ content: 'owner権限は追加/削除できません' });
    return;
  }

  const roomRepository = new RoomRepository();
  const room = await roomRepository.getRoom(interaction.channelId);
  if (!room) {
    return;
  }

  const channel = interaction.channel as VoiceChannel;

  if (!channel) {
    return;
  }

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: false,
    Connect: false,
  });

  await interaction.editReply({ content: 'ユーザーを削除したよ！' });
}

/**
 * 自動削除を切り替える
 * @param interaction 発行されたコマンド情報
 */
export async function toggleAutoDelete(interaction: ChatInputCommandInteraction<CacheType>) {
  const guild = interaction.guild;
  if (!guild) {
    return;
  }

  const roomRepository = new RoomRepository();
  const room = await roomRepository.getRoom(interaction.channelId);
  if (!room) {
    return;
  }

  room.is_autodelete = !room.is_autodelete;

  await roomRepository.updateRoom(interaction.channelId, room);

  await interaction.editReply({
    content: 'お部屋の自動削除を' + (room.is_autodelete ? '有効' : '無効') + 'にしたよ！',
  });
}

export async function changeRoomName(interaction: ChatInputCommandInteraction<CacheType>, name: string) {
  const guild = interaction.guild;
  if (!guild) {
    return;
  }

  const type = interaction.channel?.type;
  if (type !== ChannelType.GuildVoice) {
    await interaction.editReply({ content: 'チャンネル名を変更できるのはボイスチャンネルのみです' });
    return;
  }

  const roomRepository = new RoomRepository();
  const room = await roomRepository.getRoom(interaction.channelId);
  if (!room) {
    await roomRepository.createRoom({
      room_id: interaction.channelId,
      guild_id: guild.id,
      name: name,
      is_autodelete: true,
      is_live: false,
      is_private: false,
    });

    await (interaction.channel as VoiceChannel).setName(name);

    const embed = new EmbedBuilder()
      .setColor('#cc66cc')
      .setTitle(`お部屋名変更`)
      .setDescription(`${name}に変更したよ～！`)
      .setFooter({ text: `by ${interaction.user.displayName}` });

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const oldName = room.name;
  room.name = name;

  await roomRepository.updateRoom(interaction.channelId, room);
  await (interaction.channel as VoiceChannel).setName(name);

  const embed = new EmbedBuilder()
    .setColor('#cc66cc')
    .setTitle(`お部屋名変更`)
    .setDescription(`「${oldName}」から「${name}」に変更したよ～！`)
    .setFooter({ text: `by ${interaction.user.displayName}` });

  await interaction.editReply({ embeds: [embed] });
}

/**
 * 人数制限を変更する
 * @param interaction 発行されたコマンド情報
 * @param limit 人数制限
 */
export async function setLimit(interaction: ChatInputCommandInteraction<CacheType>, limit: number = 99) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply({ content: 'ボイスチャンネルのみ変更できます' });
  }

  const type = interaction.channel?.type;
  if (type !== ChannelType.GuildVoice) {
    await interaction.editReply({ content: 'ボイスチャンネルのみ人数制限を変更できます' });
    return;
  }

  if (limit < 1 || 99 < limit) {
    limit = 99;
  }

  await (interaction.channel as VoiceChannel).setUserLimit(limit);
  await interaction.editReply({ content: `人数制限を${limit}人に変更したよ！` });
}

/**
 * 配信中に変更する
 * @param interaction 発行されたコマンド情報
 */
export async function toggleLive(interaction: ChatInputCommandInteraction<CacheType>) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply({ content: 'ボイスチャンネルのみ変更できます' });
  }

  const type = interaction.channel?.type;
  if (type !== ChannelType.GuildVoice) {
    await interaction.editReply({ content: 'ボイスチャンネルのみ配信中に変更できます' });
    return;
  }

  const roomRepository = new RoomRepository();
  const room = await roomRepository.getRoom(interaction.channelId);
  if (!room) {
    return;
  }

  room.is_live = !room.is_live;

  // 名前に[●配信]とつける
  const name = room.name;
  await (interaction.channel as VoiceChannel).setName(name + (room.is_live ? ' [●配信]' : ''));

  await roomRepository.updateRoom(interaction.channelId, room);

  await interaction.editReply({
    content: '配信中に変更したよ！',
  });
}
