import { Message, Client, MessageEmbed } from 'discord.js';
import { REST } from '@discordjs/rest';
import * as SendCommand from './sendCommand';
import * as GREETING from './constant/greeting';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';

dotenv.config();

if (!process.env.TOKEN) {
    console.log('');
    throw Error('env/token is undefind');
}

const commands = [{ name: 'ping', description: 'reply with pong' }];
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

const client = new Client({
    partials: ['CHANNEL'],
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES']
});

client.once('ready', () => {
    console.log('Ready!');
    console.log(`Logged In: ${client?.user?.tag}`);
});

client.on('messageCreate', async (message: Message) => {
    // 発言者がbotの場合は落とす
    if (message.author.bot) {
        return;
    }
    console.log('> Received Message');
    console.log('  * Author:  ', message.author.tag);
    console.log('  * Content: ', message.cleanContent);
    console.log('');

    // mention to bot
    if (message.mentions.users.find((x) => x.id === client.user?.id)) {
        const hour = Number(dayjs().format('HH'));

        if (message.content.match('言語は')) {
            let res = `今動いている言語は[TypeScript]版だよ！今はまだ機能がないから許してね……\n`;
            res += 'コードはここから見れるよ～！\n';
            res += 'https://gitlab.com/Rim_EarthLights/ts-orangebot';
            message.reply(res);
            return;
        }
        if (message.content.match('おはよ')) {
            if (hour < 11) {
                // 5:00 - 10:59
                const num = SendCommand.getRndNumber(1, GREETING.OHAYOU.MORNING.length);
                const result = GREETING.OHAYOU.MORNING[num - 1];
                message.reply(result);
            } else if (hour < 17) {
                // 11:00 - 16:59
                const num = SendCommand.getRndNumber(1, GREETING.OHAYOU.NOON.length);
                const result = GREETING.OHAYOU.NOON[num - 1];
                message.reply(result);
            } else if (hour < 19) {
                // 17:00 - 18:59
                const num = SendCommand.getRndNumber(1, GREETING.OHAYOU.EVENING.length);
                const result = GREETING.OHAYOU.EVENING[num - 1];
                message.reply(result);
            } else if (hour >= 19 || hour < 5) {
                // 19:00 - 4:59
                const num = SendCommand.getRndNumber(1, GREETING.OHAYOU.NIGHT.length);
                const result = GREETING.OHAYOU.NIGHT[num - 1];
                message.reply(result);
            }
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
        if (message.content.match('(おやすみ|寝る)')) {
            if (hour >= 19 || hour === 0) {
                // 20:00 - 0:59
                message.reply('おやすみなさーい！明日もいっぱい遊ぼうね！');
            } else if (hour < 5) {
                // 1:00 - 4:59
                message.reply('すや……すや……おやすみなさい……');
            } else if (hour < 11) {
                // 5:00 - 10:59
                message.reply('え、私起きたところなんだけど…！？');
            } else if (hour < 17) {
                // 11:00 - 16:59
                message.reply('お昼寝するの！あんまり寝すぎないようにね～！');
            } else if (hour < 19) {
                // 17:00 - 18:59
                message.reply('疲れちゃった？ちゃんと目覚まし合わせた～？');
            }
            return;
        }
        if (message.content.match('(かわい|かわよ)')) {
            message.reply('えへへ～！ありがと嬉しい～！');
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
        message.reply('呼んだ？');
    }

    // command
    if (message.content.startsWith('.')) {
        const content = message.content.replace('.', '').trimEnd().split(' ');
        const command = content[0];
        content.shift();

        switch (command) {
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

client.login(process.env.TOKEN);
