import Express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Message, REST, Routes } from 'discord.js';
import * as SendCommand from './bot/commands';
import * as mention from './bot/mention';
import dotenv from 'dotenv';
import 'dayjs/locale/ja';
import { routers } from './routers';
import { COORDINATION_ID, DISCORD_CLIENT } from './constant/constants';
import { CONFIG } from './config/config';
import { joinVoiceChannel, leftVoiceChannel } from './bot/function/voice';
import { TypeOrm } from './model/typeorm/typeorm';
import { getPref } from './bot/function/forecast';
import { Music } from './bot/function/music';

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

const commands = [
    {
        name: 'play',
        description: '音楽を再生する / 音楽をキューに追加する',
        options: [
            {
                type: 'string',
                name: 'url',
                description: 'youtube url',
                required: true
            }
        ]
    }
];

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

/**
 * 反応ワードから処理を実行する
 * @param message 渡されたメッセージ
 * @returns
 */
async function wordSelector(message: Message) {
    if (message.content.match('(言語は|ヘルプ|help)')) {
        SendCommand.help(message);
        return;
    }
    if (message.content.match('おはよ')) {
        mention.morning(message);
        return;
    }
    if (message.content.match('(こんにちは|こんにちわ)')) {
        mention.hello(message);
        return;
    }
    if (message.content.match('(こんばんは|こんばんわ)')) {
        mention.evening(message);
        return;
    }
    if (message.content.match('(おやすみ|寝るね|ねるね)')) {
        mention.goodNight(message);
        return;
    }
    if (message.content.match('ガチャ')) {
        await SendCommand.gacha(message);
    }
    if (message.content.match('(かわい|かわよ|可愛い)')) {
        message.reply('えへへ～！ありがと嬉しい～！');
        return;
    }
    if (message.content.match('(癒して|癒やして|いやして)')) {
        message.reply('どしたの…？よしよし……');
        return;
    }
    if (message.content.match('(運勢|みくじ)')) {
        SendCommand.luck(message);
        return;
    }
    if (message.content.match('(天気|てんき)')) {
        const cityName = await getPref(message.author.id);
        if (!cityName) {
            message.reply('地域が登録されてないよ！\n@みかんちゃん 地域覚えて [地域]  で登録して！');
            return;
        }
        const when = message.content.match(/今日|明日|\d日後/);
        let day = 0;
        if (when != null) {
            if (when[0] === '明日') {
                day++;
            }
            if (when[0].includes('日後')) {
                const d = when[0].replace('日後', '');
                day = Number(d);
            }
        }
        SendCommand.weather(message, [cityName, day.toString()]);
        return;
    }
    if (message.content.match('地域(覚|憶|おぼ)えて')) {
        const name = message.content.split(' ')[2];
        SendCommand.reg(message, ['pref', name]);
        return;
    }
    if (message.content.match(/\d+d\d+/)) {
        const match = message.content.match(/\d+d\d+/);
        if (match == null) {
            return;
        }
        const dice = match[0].split('d');
        SendCommand.dice(message, dice);
        return;
    }
    message.reply('ごめんなさい、わからなかった……');
}

/**
 * 渡されたコマンドから処理を実行する
 *
 * @param command 渡されたメッセージ
 */
async function commandSelector(message: Message) {
    const content = message.content.replace('.', '').trimEnd().split(' ');
    const command = content[0];
    content.shift();

    switch (command) {
        case 'help': {
            await SendCommand.help(message);
            break;
        }
        case 'ping': {
            await SendCommand.ping(message);
            break;
        }
        case 'debug': {
            await SendCommand.debug(message, content);
            break;
        }
        case 'dice': {
            await SendCommand.dice(message, content);
            break;
        }
        case 'tenki': {
            await SendCommand.weather(message, content);
            break;
        }
        case 'luck': {
            await SendCommand.luck(message, content);
            break;
        }
        case 'gacha': {
            await SendCommand.gacha(message, content);
            break;
        }
        case 'celo': {
            await SendCommand.celo(message);
            break;
        }
        case 'celovs': {
            await SendCommand.celovs(message);
            break;
        }
        case 'play':
        case 'pl': {
            await SendCommand.play(message, content);
            break;
        }
        case 'interrupt':
        case 'pi': {
            await SendCommand.interrupt(message, content);
            break;
        }
        case 'stop':
        case 'st': {
            await SendCommand.stop(message);
            break;
        }
        case 'rem':
        case 'rm': {
            await SendCommand.rem(message, content);
            break;
        }
        case 'q': {
            await SendCommand.queue(message);
            break;
        }
        case 'shuffle':
        case 'sf': {
            await SendCommand.shuffle(message);
            break;
        }
        case 'reg': {
            await SendCommand.reg(message, content);
            break;
        }
    }
}

DISCORD_CLIENT.login(CONFIG.TOKEN);
