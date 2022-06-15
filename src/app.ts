import { Message, Client, MessageEmbed } from 'discord.js';
import { REST } from '@discordjs/rest';
import dotenv from 'dotenv';

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
    console.log('Author:  ', message.author);
    console.log('Content: ', message.content);

    // mention to bot
    if (message.mentions.users.find((x) => x.id === client.user?.id)) {
        if (message.content.includes('言語は')) {
            let res = `今動いている言語は[TypeScript]版だよ！今はまだ機能がないから許してね……\n`;
            res += 'コードはここから見れるよ～！\n';
            res += 'https://gitlab.com/Rim_EarthLights/ts-orangebot';
            message.reply(res);
            return;
        }
        message.reply('呼んだ？');
    }

    // command
    if (message.content.startsWith('.')) {
        const content = message.content.replace('.', '').trimEnd().split(' ');
        const command = content[0];

        switch (command) {
            case 'ping': {
                message.channel.send('Pong!');
                break;
            }
        }
    }
});

client.login(process.env.TOKEN);
