import Express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Message } from 'discord.js';
import * as SendCommand from './bot/commands';
import * as mention from './bot/mention';
import dotenv from 'dotenv';
import 'dayjs/locale/ja';
import { routers } from './routers';
import { COORDINATION_ID, DISCORD_CLIENT } from './constant/constants';
import { CONFIG } from './config/config';

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

DISCORD_CLIENT.once('ready', () => {
    console.log('Ready!');
    console.log(`Logged In: ${DISCORD_CLIENT?.user?.tag}`);
});

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
    console.log('  * Content: ', message.cleanContent);
    console.log('');

    // mention to bot
    if (message.mentions.users.find((x) => x.id === DISCORD_CLIENT.user?.id)) {
        wordSelector(message);
    }

    // command
    if (message.content.startsWith('.')) {
        commandSelector(message);
    }
});

/**
 * 反応ワードから処理を実行する
 * @param message 渡されたメッセージ
 * @returns
 */
function wordSelector(message: Message) {
    if (message.content.match('(言語は|ヘルプ|help)')) {
        SendCommand.help(message);
        return;
    }
    if (message.content.match('おはよ')) {
        mention.morning(message);
        return;
    }
    if (message.content.match('(こんにちは|こんにちわ)')) {
        message.reply('こんにちは～！');
        return;
    }
    if (message.content.match('(こんばんは|こんばんわ)')) {
        message.reply('こんばんは～！');
        return;
    }
    if (message.content.match('(おやすみ|寝るね|ねるね)')) {
        mention.goodNight(message);
        return;
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
        const cityName = message.content.match(/ .+(区|市|村)/);
        if (cityName == null) {
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
        SendCommand.weather(message, [cityName[0].trimStart(), day.toString()]);
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
function commandSelector(message: Message) {
    const content = message.content.replace('.', '').trimEnd().split(' ');
    const command = content[0];
    content.shift();

    switch (command) {
        case 'help': {
            SendCommand.help(message);
            break;
        }
        case 'ping': {
            SendCommand.ping(message);
            break;
        }
        case 'debug': {
            SendCommand.debug(message, content);
            break;
        }
        case 'dice': {
            SendCommand.dice(message, content);
            break;
        }
        case 'tenki': {
            SendCommand.weather(message, content);
            break;
        }
        case 'luck': {
            SendCommand.luck(message, content);
            break;
        }
        case 'gacha': {
            SendCommand.gacha(message, content);
            break;
        }
        case 'celo': {
            SendCommand.celo(message);
            break;
        }
        case 'celovs': {
            SendCommand.celovs(message);
            break;
        }
    }
}

DISCORD_CLIENT.login(CONFIG.TOKEN);
