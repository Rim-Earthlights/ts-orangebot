import Express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ChannelType, Message, REST, Routes, SlashCommandBuilder, User } from 'discord.js';
import { commandSelector, interactionSelector } from './bot/commands.js';
import { wordSelector } from './bot/mention.js';
import dotenv from 'dotenv';
import 'dayjs/locale/ja.js';
import { routers } from './routers.js';
import { COORDINATION_ID, DISCORD_CLIENT } from './constant/constants.js';
import { CONFIG } from './config/config.js';
import { joinVoiceChannel, leftVoiceChannel } from './bot/dot_function/voice.js';
import { TypeOrm } from './model/typeorm/typeorm.js';
import * as logger from './common/logger.js';
import { ItemRepository } from './model/repository/itemRepository.js';
import { GACHA_LIST } from './constant/gacha/gachaList.js';
import { initJob } from './job/job.js';
import { switchFunctionByAPIKey } from './common/common.js';
import { UsersRepository } from './model/repository/usersRepository.js';
import { Users } from './model/models/users.js';
import { GachaList } from './bot/function/gacha.js';

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

const commands = [
    // ping command
    new SlashCommandBuilder().setName('ping').setDescription('replies with pong'),
    // gacha command
    new SlashCommandBuilder()
        .setName('gacha')
        .setDescription('ガチャ関連機能')
        .addSubcommand((sc) =>
            sc
                .setName('pick')
                .setDescription('ガチャを引きます. 回数指定しない場合は10回引きます. ')
                .addNumberOption((option) => option.setName('num').setDescription('回数').setRequired(false))
                .addBooleanOption((option) =>
                    option
                        .setName('limit')
                        .setDescription('Trueにするとチケット分も全て引きます。回数指定は無視されます。')
                        .setRequired(false)
                )
        )
        .addSubcommand((sc) => sc.setName('list').setDescription('あなたのガチャ景品を表示します'))
        .addSubcommand((sc) =>
            sc
                .setName('extra')
                .setDescription('ガチャを試し引きします. 景品取得判定にはなりません.')
                .addNumberOption((option) => option.setName('num').setDescription('回数').setRequired(false))
                .addStringOption((option) =>
                    option.setName('item').setDescription('アイテム名 or 等級').setRequired(false)
                )
        ),
    new SlashCommandBuilder()
        .setName('gc')
        .setDescription('/gachaの短縮形です. 回数指定しない場合は10回引きます.')
        .addNumberOption((option) => option.setName('num').setDescription('回数').setRequired(false))
        .addBooleanOption((option) =>
            option
                .setName('limit')
                .setDescription('Trueにするとチケット分も全て引きます. 回数指定は無視されます.')
                .setRequired(false)
        ),
    new SlashCommandBuilder().setName('gl').setDescription('/gacha limitの短縮形コマンドです.'),
    new SlashCommandBuilder()
        .setName('gpt')
        .setDescription('ChatGPTとおしゃべりします')
        .addStringOption((option) => option.setName('text').setDescription('text').setRequired(true)),
    new SlashCommandBuilder()
        .setName('g4')
        .setDescription('GPT-4でおしゃべりします(非常にレスポンスが遅いので注意)')
        .addStringOption((option) => option.setName('text').setDescription('text').setRequired(true)),
    new SlashCommandBuilder()
        .setName('erase')
        .setDescription('ChatGPTとのチャット履歴を削除します')
        .addBooleanOption((option) => option.setName('last').setDescription('直前のみ削除します').setRequired(false))
    // new SlashCommandBuilder().setName('tenki').setDescription('天気予報を表示します'),
    // new SlashCommandBuilder().setName('luck').setDescription('今日の運勢を表示します'),
    // new SlashCommandBuilder().setName('info').setDescription('ユーザ情報を表示します'),
    // new SlashCommandBuilder()
    //     .setName('pl')
    //     .setDescription('音楽を再生します')
    //     .addStringOption((option) => option.setName('url').setDescription('youtube url').setRequired(true))
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD.TOKEN);

CONFIG.DISCORD.COMMAND_GUILD_ID.map((gid) => {
    rest.put(Routes.applicationGuildCommands(CONFIG.DISCORD.APP_ID, gid), { body: [] })
        .then(() => logger.info(gid, 'rem-command', 'successfully remove command.'))
        .catch(console.error);
    rest.put(Routes.applicationGuildCommands(CONFIG.DISCORD.APP_ID, gid), { body: commands })
        .then(() => logger.info(gid, 'reg-command', 'successfully add command.'))
        .catch(console.error);
});

DISCORD_CLIENT.login(CONFIG.DISCORD.TOKEN);

/**
 * bot初回読み込み
 */
DISCORD_CLIENT.once('ready', async () => {
    // APIキーによって有効無効を切り替える
    switchFunctionByAPIKey();

    // DBの初期化
    TypeOrm.dataSource
        .initialize()
        .then(async () => {
            // DBの初期化と再構築
            await new ItemRepository().init(GACHA_LIST);
            GachaList.allItemList = await new ItemRepository().getAll();
            await logger.info('system', 'db-init', 'success');
        })
        .catch((e) => {
            logger.error('system', 'db-init', e);
        });
    // 定時バッチ処理 (cron)
    await initJob();
    await logger.info(undefined, 'ready', `discord bot logged in: ${DISCORD_CLIENT.user?.username}`);
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

    await logger.info(
        message.guild ? message.guild.id : 'dm',
        'message-received',
        [
            ``,
            `gid: ${message.guild?.id}, gname: ${message.guild?.name}`,
            `cid: ${message.channel.id}, cname: ${
                message.channel.type !== ChannelType.DM ? message.channel.name : 'dm'
            }`,
            `author: ${message.author.username}`,
            `content: ${message.content}`,
            ...message.attachments.map((a) => `file: ${a.url}`)
        ].join('\n')
    );

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
});

/**
 * コマンドの受信イベント
 */
DISCORD_CLIENT.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }
    await logger.info(
        interaction.guild ? interaction.guild.id : 'dm',
        'message-received',
        [`cid: ${interaction.channel?.id}`, `author: ${interaction.user.username}`, `content: ${interaction}`].join(
            '\n'
        )
    );
    await interactionSelector(interaction);
});

/**
 * リアクション追加イベント
 */
DISCORD_CLIENT.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            return;
        }
    }

    if (reaction.message.author?.id !== DISCORD_CLIENT.user?.id || user.bot) {
        return;
    }

    const title = reaction.message.embeds.find((e) => e.title === 'ルールを読んだ');
    if (!title) {
        return;
    }
    if (reaction.message.channel.type === ChannelType.GuildText) {
        await reaction.users.remove(user.id);

        const u = reaction.message.guild?.members.cache.get(user.id);
        const role = u?.roles.cache.find((role) => role.id === CONFIG.DISCORD.MEMBER_ROLE_ID);
        if (role) {
            const message = await reaction.message.reply(`もうロールが付いてるみたい！`);
            setTimeout(async () => {
                await message.delete();
            }, 3000);
            return;
        }

        // add user role
        await u?.roles.add(CONFIG.DISCORD.MEMBER_ROLE_ID);

        // register user
        const userRepository = new UsersRepository();
        const userEntity = await userRepository.get(user.id);
        if (!userEntity) {
            const saveUser: Partial<Users> = {
                id: user.id,
                user_name: user.username
            };
            await userRepository.save(saveUser);
        }

        const message = await reaction.message.reply(`読んでくれてありがと～！ロールを付与したよ！`);
        setTimeout(async () => {
            await message.delete();
        }, 3000);
        return;
    }
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
        await logger.info(
            oldState.guild.id,
            'leftVoiceChannel',
            `ch: ${oldState.channel?.name}, user: ${(await DISCORD_CLIENT.users.fetch(oldState.id)).username}`
        );
        await leftVoiceChannel(guild, oldState);
    } else if (oldState.channelId === null) {
        await logger.info(
            oldState.guild.id,
            'joinVoiceChannel',
            `ch: ${newState.channel?.name}, user: ${(await DISCORD_CLIENT.users.fetch(newState.id)).username}`
        );
        await joinVoiceChannel(guild, newState);
    } else {
        await logger.info(
            oldState.guild.id,
            'moveVoiceChannel',
            `ch: ${oldState.channel?.name} -> ${newState.channel?.name}, user: ${
                (
                    await DISCORD_CLIENT.users.fetch(oldState.id)
                ).username
            }`
        );
        //left
        await leftVoiceChannel(guild, oldState);
        // joined
        await joinVoiceChannel(guild, newState);
    }
});
