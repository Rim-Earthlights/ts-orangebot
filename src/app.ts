import Express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ChannelType, Message, REST, Routes } from 'discord.js';
import { commandSelector, interactionSelector } from './bot/commands.js';
import { wordSelector } from './bot/mention.js';
import dotenv from 'dotenv';
import 'dayjs/locale/ja.js';
import { routers } from './routers.js';
import { COORDINATION_ID, DISCORD_CLIENT } from './constant/constants.js';
import { CONFIG } from './config/config.js';
import { joinVoiceChannel, leftVoiceChannel } from './bot/dot_function/voice.js';
import { TypeOrm } from './model/typeorm/typeorm.js';
import { ItemRepository } from './model/repository/itemRepository.js';
import { GACHA_LIST } from './constant/gacha/gachaList.js';
import { initJob } from './job/job.js';
import { checkUserType, switchFunctionByAPIKey } from './common/common.js';
import { GachaList } from './bot/function/gacha.js';
import { reactionSelector } from './bot/reactions.js';
import { SLASH_COMMANDS } from './constant/slashCommands.js';
import { LogLevel } from './type/types.js';
import { Logger } from './common/logger.js';
import { GuildRepository } from './model/repository/guildRepository.js';
import { Chat } from './bot/dot_function/index.js';
import { ChatGPTModel } from './constant/chat/chat.js';
import { UsersType } from './model/models/users.js';

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

// launch server.
app.listen(port, hostName);

/**
 * =======================
 * Bot Process
 * =======================
 */
console.log('==================================================');

const commands = SLASH_COMMANDS.map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD.TOKEN);

DISCORD_CLIENT.login(CONFIG.DISCORD.TOKEN);

/**
 * bot初回読み込み
 */
DISCORD_CLIENT.once('ready', async () => {
    // APIキーによって有効無効を切り替える
    switchFunctionByAPIKey();

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
                message: ['success']
            });
        })
        .catch(async (e) => {
            await Logger.put({
                guild_id: undefined,
                channel_id: undefined,
                user_id: undefined,
                level: LogLevel.SYSTEM,
                event: 'db-init',
                message: [e.message]
            });
        });
    // 定時バッチ処理 (cron)
    await initJob();

    const repository = new GuildRepository();

    // サーバー登録
    DISCORD_CLIENT.guilds.cache.map(async (guild) => {
        await repository.save({
            id: guild.id,
            name: guild.name
        });
        await Logger.put({
            guild_id: guild.id,
            channel_id: undefined,
            user_id: undefined,
            level: LogLevel.SYSTEM,
            event: 'guild-register',
            message: [`id : ${guild.id}`, `name : ${guild.name}`]
        });
    });

    // コマンド登録
    const guilds = await repository.getAll();
    guilds.map((guild) => {
        rest.put(Routes.applicationGuildCommands(CONFIG.DISCORD.APP_ID, guild.id), { body: commands })
            .then(
                async () =>
                    await Logger.put({
                        guild_id: guild.id,
                        channel_id: undefined,
                        user_id: undefined,
                        level: LogLevel.SYSTEM,
                        event: 'reg-command|add',
                        message: ['successfully add command.']
                    })
            )
            .catch(console.error);
    });

    // DM用コマンド登録
    rest.put(Routes.applicationCommands(CONFIG.DISCORD.APP_ID), { body: commands }).then(async () => {
        await Logger.put({
            guild_id: undefined,
            channel_id: undefined,
            user_id: undefined,
            level: LogLevel.SYSTEM,
            event: 'reg-command|add',
            message: ['successfully add command to DM.']
        });
    });

    await Logger.put({
        guild_id: undefined,
        channel_id: undefined,
        user_id: undefined,
        level: LogLevel.SYSTEM,
        event: 'ready',
        message: [`discord bot logged in: ${DISCORD_CLIENT.user?.username}`]
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

    await Logger.put({
        guild_id: message.guild ? message.guild.id : undefined,
        channel_id: message.channel.id ? message.channel.id : undefined,
        user_id: message.author.id,
        level: LogLevel.INFO,
        event: 'message-received',
        message: [
            `gid: ${message.guild?.id}, gname: ${message.guild?.name}`,
            `cid: ${message.channel.id}, cname: ${
                message.channel.type !== ChannelType.DM ? message.channel.name : 'DM'
            }`,
            `author : ${message.author.username}`,
            `content: ${message.content}`,
            ...message.attachments.map((a) => `file   : ${a.url}`)
        ]
    });

    // mention to bot
    if (message.mentions.users.find((x) => x.id === DISCORD_CLIENT.user?.id)) {
        await wordSelector(message);
        return;
    }

    // command
    if (message.content.startsWith('.')) {
        await commandSelector(message);
        return;
    }

    if (message.channel.type === ChannelType.DM) {
        if (await checkUserType(message.author.id, UsersType.OWNER)) {
            await Chat.talk(message, message.cleanContent, ChatGPTModel.GPT_4_32K);
            return;
        }
        await Chat.talk(message, message.cleanContent, ChatGPTModel.GPT_4_HALF);
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
    await Logger.put({
        guild_id: interaction.guild ? interaction.guild.id : undefined,
        channel_id: interaction.channel?.id,
        user_id: interaction.user.id,
        level: LogLevel.INFO,
        event: 'interaction-received',
        message: [`cid: ${interaction.channel?.id}`, `author: ${interaction.user.username}`, `content: ${interaction}`]
    });
    await interactionSelector(interaction);
});

/**
 * リアクション追加イベント
 */
DISCORD_CLIENT.on('messageReactionAdd', async (reaction, user) => {
    await reactionSelector(reaction, user);
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
        await Logger.put({
            guild_id: oldState.guild.id,
            channel_id: oldState.channel?.id,
            user_id: oldState.id,
            level: LogLevel.INFO,
            event: 'vc-left',
            message: [
                `ch: ${oldState.channel?.name}`,
                `user: ${(await DISCORD_CLIENT.users.fetch(oldState.id)).username}`
            ]
        });
        await leftVoiceChannel(guild, oldState);
    } else if (oldState.channelId === null) {
        await Logger.put({
            guild_id: newState.guild.id,
            channel_id: newState.channel?.id,
            user_id: newState.id,
            level: LogLevel.INFO,
            event: 'vc-join',
            message: [
                `ch: ${newState.channel?.name}`,
                `user: ${(await DISCORD_CLIENT.users.fetch(newState.id)).username}`
            ]
        });
        await joinVoiceChannel(guild, newState);
    } else {
        await Logger.put({
            guild_id: newState.guild.id,
            channel_id: newState.channel?.id,
            user_id: newState.id,
            level: LogLevel.INFO,
            event: 'vc-move',
            message: [
                `ch: ${oldState.channel?.name} -> ${newState.channel?.name}`,
                `user: ${(await DISCORD_CLIENT.users.fetch(newState.id)).username}`
            ]
        });
        //left
        await leftVoiceChannel(guild, oldState);
        // joined
        await joinVoiceChannel(guild, newState);
    }
});
