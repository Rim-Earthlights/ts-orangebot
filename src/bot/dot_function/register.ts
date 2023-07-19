import { EmbedBuilder, Message } from 'discord.js';
import { UsersRepository } from '../../model/repository/usersRepository.js';

/**
 * ユーザー情報を更新する
 * @param message
 * @param args
 * @returns
 */
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
                user_name: message.author.username,
                pref: regName[0]
            });

            const send = new EmbedBuilder().setColor('#ff9900').setTitle(`登録`).setDescription(`居住地: ${regName}`);

            message.reply({ content: `以下の内容で登録したよ～！`, embeds: [send] });
            break;
        }
        case 'name': {
            const userId = message.author.id;
            await message.guild?.members.fetch(userId).then(async (member) => {
                await member.setNickname(regName[0]);
            });
            const send = new EmbedBuilder().setColor('#ff9900').setTitle(`登録`).setDescription(`名前: ${regName}`);
            message.reply({ content: `${regName}さんって言うんだね！覚えたよ～！`, embeds: [send] });
            break;
        }
        case 'birth': {
            const userId = message.author.id;

            if (regName[0].match(/\d\d\d\d/)) {
                const month = regName[0].substring(0, 2);
                const day = regName[0].substring(2, 4);

                const users = new UsersRepository();
                await users.save({
                    id: userId,
                    user_name: message.author.username,
                    birth_date: `1900-${month}-${day} 00:00:00`
                });

                const send = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle(`登録`)
                    .setDescription(`誕生日: ${month}月${day}日`);

                message.reply({ content: `以下の内容で登録したよ～！`, embeds: [send] });
            }
            break;
        }
        default:
            break;
    }
}
