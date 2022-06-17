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
const port = Number(process.env.PORT) || 4044;
// const user = process.env.USER ? process.env.USER : 'default';
const hostName = process.env.HOSTNAME ? process.env.HOSTNAME : 'localhost';

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

if (!process.env.TOKEN) {
    console.log('');
    throw Error('env/token is undefind');
}

// const commands = [{ name: 'ping', description: 'reply with pong' }];
// const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

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
        if (message.content.match('(言語は|ヘルプ)')) {
            SendCommand.help(message);
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
            SendCommand.weatherToday(message);
            return;
        }
        message.reply('ごめんなさい、わからなかった……');
    }

    // command
    if (message.content.startsWith('.')) {
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
                SendCommand.luck(message);
                break;
            }
        }
    }
});

DISCORD_CLIENT.login(process.env.TOKEN);
