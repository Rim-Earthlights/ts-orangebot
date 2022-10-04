import Express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Message } from 'discord.js';
import { commandSelector } from './bot/commands';
import { wordSelector } from './bot/mention';
import dotenv from 'dotenv';
import 'dayjs/locale/ja';
import { routers } from './routers';
import { COORDINATION_ID, DISCORD_CLIENT } from './constant/constants';
import { CONFIG } from './config/config';
import { joinVoiceChannel, leftVoiceChannel } from './bot/function/voice';
import { TypeOrm } from './model/typeorm/typeorm';
import { PlayerManager } from 'discord-player-plus';

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
const port = CONFIG.PORT;
// const user = process.env.USER ? process.env.USER : 'default';
const hostName = CONFIG.HOSTNAME;

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

DISCORD_CLIENT.login(CONFIG.TOKEN);

/**
 * bot初回読み込み
 */
DISCORD_CLIENT.once('ready', async () => {
    TypeOrm.dataSource
        .initialize()
        .then(async () => {
            console.log('db initialized.');
        })
        .catch((e) => {
            console.log(e);
        });

    console.log('Ready!');
    console.log(`Logged In: ${DISCORD_CLIENT?.user?.tag}`);
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

    console.log('> Received Message');
    console.log('  * Author:  ', message.author.tag);
    console.log('  * Content: ', message.content);
    console.log('');

    console.log(message.mentions.users);
    console.log(DISCORD_CLIENT.user?.id);

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
        //left
        await leftVoiceChannel(guild, oldState);
        console.log('user left channel', oldState.channelId);
    } else if (oldState.channelId === null) {
        // joined
        await joinVoiceChannel(guild, newState);
        console.log('user joined channel', newState.channelId);
    }
    // moved
    else {
        //left
        await leftVoiceChannel(guild, oldState);
        // joined
        await joinVoiceChannel(guild, newState);
        console.log('user moved channel', oldState.channelId, newState.channelId);
    }
});
