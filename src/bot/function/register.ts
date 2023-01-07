import { EmbedBuilder, Message } from 'discord.js';
import { UsersRepository } from '../../model/repository/usersRepository';

export async function save(message: Message, args?: string[]): Promise<void> {
    if (!args || args.length <= 1) {
        return;
    }

    const regType = args[0];
    args.shift();
    const regName = args;

    switch (regType) {
        case 'pref': {
            const userId = message.author.id;

            const users = new UsersRepository();
            await users.save({
                id: userId,
                user_name: message.author.tag,
                pref: regName[0]
            });

            const send = new EmbedBuilder().setColor('#ff9900').setTitle(`登録`).setDescription(`居住地: ${regName}`);

            message.reply({ content: `以下の内容で登録したよ～！`, embeds: [send] });
            break;
        }
        default:
            break;
    }
}
