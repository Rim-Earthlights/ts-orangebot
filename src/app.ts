import bodyParser from 'body-parser';
import cors from 'cors';
import 'dayjs/locale/ja.js';
import { ChannelType, Message, MessageType, REST, Routes, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import Express from 'express';
import helmet from 'helmet';
import { Chat, Room } from './bot/dot_function/index.js';
import { joinVoiceChannel, leftVoiceChannel } from './bot/dot_function/voice.js';
import { GachaList } from './bot/function/gacha.js';
import { reactionSelector } from './bot/reactions.js';
import { switchFunctionByAPIKey } from './common/common.js';
import { Logger } from './common/logger.js';
import { CONFIG } from './config/config.js';
import { LiteLLMMode } from './constant/chat/chat.js';
import { COORDINATION_ID, DISCORD_CLIENT } from './constant/constants.js';
import { GACHA_LIST } from './constant/gacha/gachaList.js';
import { DM_SLASH_COMMANDS, SERVER_SLASH_COMMANDS } from './constant/slashCommands.js';
import { initJob } from './job/job.js';
import { GuildRepository } from './model/repository/guildRepository.js';
import { ItemRepository } from './model/repository/itemRepository.js';
import { RoomRepository } from './model/repository/roomRepository.js';
import { UsersRepository } from './model/repository/usersRepository.js';
import { TypeOrm } from './model/typeorm/typeorm.js';
import { routers } from './routers.js';
import { LogLevel } from './type/types.js';
import { InteractionManager } from './bot/manager/interaction.manager.js';
import { MessageManager } from './bot/manager/message.manager.js';
import { CHAT_PAUSE_FLAGS } from './bot/manager/handlers/interactions/pause.handler.js';

dotenv.config();

/**
 * =======================
 * API Server
 * =======================
 */

// express/helmet/cors
const app = Express();
app.use(helmet());
app.use(cors());

// ejs
app.set('view engine', 'ejs');

// static files
app.use(Express.static('public'));

//body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// port
const port = CONFIG.COMMON.PORT;
// const user = process.env.USER ? process.env.USER : 'default';
const hostName = CONFIG.COMMON.HOSTNAME;

// route settings in routers.ts
app.use('/', routers);

// No match uri
app.use((req, res) => {
  res.status(404).send({ status: 404, message: 'NOT FOUND' });
});

console.log('==================================================');

// DBの初期化
await TypeOrm.dataSource
  .initialize()
  .then(async () => {
    // DBの初期化と再構築
    await new ItemRepository().init(GACHA_LIST);
    GachaList.allItemList = await new ItemRepository().getAll();
    await Logger.put({
      guild_id: undefined,
      channel_id: undefined,
      user_id: undefined,
      level: LogLevel.SYSTEM,
      event: 'db-init',
      message: ['success'],
    });
  })
  .catch(async (e) => {
    await Logger.put({
      guild_id: undefined,
      channel_id: undefined,
      user_id: undefined,
      level: LogLevel.SYSTEM,
      event: 'db-init',
      message: [e.message],
    });
    return;
  });

// launch server.
app.listen(port, hostName);

/**
 * =======================
 * Bot Process
 * =======================
 */

const commands = SERVER_SLASH_COMMANDS.map((command) => command.toJSON());
const dmCommands = DM_SLASH_COMMANDS.map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD.TOKEN);

DISCORD_CLIENT.login(CONFIG.DISCORD.TOKEN);

/**
 * bot初回読み込み
 */
DISCORD_CLIENT.once('ready', async () => {
  // APIキーによって有効無効を切り替える
  switchFunctionByAPIKey();

  // 定時バッチ処理 (cron)
  await initJob();

  const repository = new GuildRepository();

  // サーバー登録
  DISCORD_CLIENT.guilds.cache.map(async (guild) => {
    await repository.save({
      id: guild.id,
      name: guild.name,
    });
    await Logger.put({
      guild_id: guild.id,
      channel_id: undefined,
      user_id: undefined,
      level: LogLevel.SYSTEM,
      event: 'guild-register',
      message: [`id : ${guild.id}`, `name : ${guild.name}`],
    });
  });

  // コマンド登録
  const guilds = await repository.getAll();
  guilds.map(async (guild) => {
    await new RoomRepository().init(guild.id);
    rest
      .put(Routes.applicationGuildCommands(CONFIG.DISCORD.APP_ID, guild.id), { body: commands })
      .then(
        async () =>
          await Logger.put({
            guild_id: guild.id,
            channel_id: undefined,
            user_id: undefined,
            level: LogLevel.SYSTEM,
            event: 'reg-command|add',
            message: ['successfully add command.'],
          })
      )
      .catch(console.error);
  });

  // DM用コマンド登録
  rest.put(Routes.applicationCommands(CONFIG.DISCORD.APP_ID), { body: dmCommands }).then(async () => {
    await Logger.put({
      guild_id: undefined,
      channel_id: undefined,
      user_id: undefined,
      level: LogLevel.SYSTEM,
      event: 'reg-command|add',
      message: ['successfully add command to DM.'],
    });
  });

  await Logger.put({
    guild_id: undefined,
    channel_id: undefined,
    user_id: undefined,
    level: LogLevel.SYSTEM,
    event: 'ready',
    message: [`discord bot logged in: ${DISCORD_CLIENT.user?.displayName}`],
  });
});

/**
 * メッセージの受信イベント
 */
DISCORD_CLIENT.on('messageCreate', async (message: Message) => {
  const coordinationId = COORDINATION_ID.find((id) => id === message.author.id);
  if (coordinationId) {
    // TODO: 特定IDとの絡み/連携
    return;
  }

  // 発言者がbotの場合は落とす
  if (message.author.bot) {
    return;
  }

  // mention to bot
  if (message.mentions.users.find((x) => x.id === DISCORD_CLIENT.user?.id)) {
    if (
      message.content.includes(`<@${DISCORD_CLIENT.user?.id}>`) &&
      message.content.trimEnd() !== `<@${DISCORD_CLIENT.user?.id}>`
    ) {
      await Logger.put({
        guild_id: message.guild ? message.guild.id : undefined,
        channel_id: message.channel.id ? message.channel.id : undefined,
        user_id: message.author.id,
        level: LogLevel.INFO,
        event: 'message-received | Mention',
        message: [
          `gid: ${message.guild?.id}, gname: ${message.guild?.name}`,
          `cid: ${message.channel.id}, cname: ${message.channel.type !== ChannelType.DM ? message.channel.name : 'DM'}`,
          `author : ${message.author.displayName}`,
          `content: ${message.content}`,
          ...message.attachments.map((a) => `file   : ${a.url}`),
        ],
      });

      await Chat.talk(message, message.content, LiteLLMMode.DEFAULT);
    }
    // await wordSelector(message);
    return;
  }

  if (message.mentions.users.size >= 1) {
    if (message.channel.type === ChannelType.GuildVoice) {
      await Room.updateRoomSettings(
        message.channel,
        message.mentions.users.map((u) => u)
      );
    }
  }

  // command
  if (message.content.startsWith('.')) {
    await new MessageManager(message).handle();
    return;
  }

  if (message.channel.type === ChannelType.DM) {
    if (CHAT_PAUSE_FLAGS.includes(message.channel.id)) {
      return;
    }
    await Logger.put({
      guild_id: message.guild ? message.guild.id : undefined,
      channel_id: message.channel.id ? message.channel.id : undefined,
      user_id: message.author.id,
      level: LogLevel.INFO,
      event: 'message-received | DM',
      message: [
        `gid: ${message.guild?.id}, gname: ${message.guild?.name}`,
        `cid: ${message.channel.id}, cname: DM`,
        `author : ${message.author.displayName}`,
        `content: ${message.content}`,
        ...message.attachments.map((a) => `file   : ${a.url}`),
      ],
    });
    await Chat.talk(message, message.content, LiteLLMMode.DEFAULT);
    return;
  } else if (message.channel.id === '1020972071460814868') {
    if (CHAT_PAUSE_FLAGS.includes(message.channel.id)) {
      return;
    }
    // 返信メッセージには反応しない
    if (message.type === MessageType.Reply) {
      return;
    }

    await Logger.put({
      guild_id: message.guild ? message.guild.id : undefined,
      channel_id: message.channel.id ? message.channel.id : undefined,
      user_id: message.author.id,
      level: LogLevel.INFO,
      event: 'message-received | DM',
      message: [
        `gid: ${message.guild?.id}, gname: ${message.guild?.name}`,
        `cid: ${message.channel.id}, cname: ${message.channel.name}`,
        `author : ${message.author.displayName}`,
        `content: ${message.content}`,
        ...message.attachments.map((a) => `file   : ${a.url}`),
      ],
    });
    await Chat.talk(message, message.content, LiteLLMMode.DEFAULT);
    return;
  } else {
    await Logger.put({
      guild_id: message.guild ? message.guild.id : undefined,
      channel_id: message.channel.id ? message.channel.id : undefined,
      user_id: message.author.id,
      level: LogLevel.INFO,
      event: 'message-received | Guild',
      message: [
        `gid: ${message.guild?.id}, gname: ${message.guild?.name}`,
        `cid: ${message.channel.id}, cname: ${message.channel.name}`,
        `author : ${message.author.displayName}`,
        `content: ${message.content}`,
        ...message.attachments.map((a) => `file   : ${a.url}`),
      ],
    });
    return;
  }
});

/**
 * コマンドの受信イベント
 */
DISCORD_CLIENT.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  await new InteractionManager(interaction).handle();
  return;
});

/**
 * リアクション追加イベント
 */
DISCORD_CLIENT.on('messageReactionAdd', async (reaction, user) => {
  await reactionSelector(reaction, user);
});

/**
 * メンバーが退出した
 */
DISCORD_CLIENT.on('guildMemberRemove', async (member) => {
  // user delete from guild
  const userRepository = new UsersRepository();
  const user = await userRepository.get(member.guild.id, member.user.id);
  if (user) {
    await userRepository.delete(member.guild.id, user.id);
  }

  const channel = (await member.guild.channels.fetch('1239718107073875978')) as TextChannel;
  if (!channel) {
    return;
  }
  await channel.send(`leaved guild: ${member.guild.name} user: ${member.user.displayName}`);
  await Logger.put({
    guild_id: member.guild ? member.guild.id : undefined,
    channel_id: undefined,
    user_id: member.user.id,
    level: LogLevel.INFO,
    event: 'guild-member-remove',
    message: [`gid: ${member.guild?.id}`, `gname: ${member.guild?.name}`, `user: ${member.user.displayName}`],
  });
});

/**
 * ボイスステータスのアップデート時に呼ばれる
 * JOIN, LEFT, MUTE, UNMUTE
 */
DISCORD_CLIENT.on('voiceStateUpdate', async (oldState, newState) => {
  // get guild
  const gid = newState.guild.id ? newState.guild.id : oldState.guild.id;
  const guild = DISCORD_CLIENT.guilds.cache.get(gid);
  if (!guild) {
    return;
  }

  if (oldState.channelId === newState.channelId) {
    return;
  }

  if (newState.channelId === null) {
    const user = await DISCORD_CLIENT.users.fetch(newState.id);
    await Logger.put({
      guild_id: oldState.guild.id,
      channel_id: oldState.channel?.id,
      user_id: oldState.id,
      level: LogLevel.INFO,
      event: 'vc-left',
      message: [`ch: ${oldState.channel?.name}`, `user: ${oldState.member?.displayName}`],
    });
    await leftVoiceChannel(guild, user.id, oldState);
  } else if (oldState.channelId === null) {
    const user = await DISCORD_CLIENT.users.fetch(newState.id);
    await Logger.put({
      guild_id: newState.guild.id,
      channel_id: newState.channel?.id,
      user_id: newState.id,
      level: LogLevel.INFO,
      event: 'vc-join',
      message: [`ch: ${newState.channel?.name}`, `user: ${newState.member?.displayName}`],
    });
    await joinVoiceChannel(guild, user.id, newState);
  } else {
    const user = await DISCORD_CLIENT.users.fetch(newState.id);
    await Logger.put({
      guild_id: newState.guild.id,
      channel_id: newState.channel?.id,
      user_id: newState.id,
      level: LogLevel.INFO,
      event: 'vc-move',
      message: [`ch: ${oldState.channel?.name} -> ${newState.channel?.name}`, `user: ${newState.member?.displayName}`],
    });
    //left
    await leftVoiceChannel(guild, user.id, oldState);
    // joined
    await joinVoiceChannel(guild, user.id, newState);
  }
});
