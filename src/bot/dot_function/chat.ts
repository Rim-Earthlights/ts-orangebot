import { EmbedBuilder, Message } from 'discord.js';
import dayjs from 'dayjs';
import { GPTMode, Role, gptList, initalize } from '../../constant/chat/chat.js';
import { ChatGPTModel } from '../../config/config.js';
import { Logger } from '../../common/logger.js';
import { LogLevel } from '../../type/types.js';

/**
 * ChatGPTで会話する
 */
export async function talk(message: Message, content: string, model: ChatGPTModel, mode: GPTMode) {
    const { id, isGuild } = getIdInfo(message);
    let gpt = gptList.gpt.find(c => c.id === id);
    if (!gpt) {
        gpt = await initalize(id, model, mode, isGuild);
        gptList.gpt.push(gpt);
    }
    const openai = gpt.openai;

    const systemContent = {
        date: dayjs().format('YYYY/MM/DD HH:mm:ss'),
        user: `<@${message.author.id}>`
    };

    const sendContent = `${JSON.stringify(systemContent)}\n${content}`;

    gpt.chat.push({
            role: Role.USER,
            content: sendContent
        });

    const response = await openai.chat.completions.create({
        model: model,
        messages: gpt.chat,
    });

    const completion = response.choices[0].message;

    if (!completion.content) {
        const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`contentがnull`);
        await message.reply({ embeds: [send] });
        return;
    }

    gpt.chat.push({ role: Role.ASSISTANT, content: completion.content });
    gpt.timestamp = dayjs();

    if (completion.content.length > 2000) {
        const texts = completion.content.split('\n');
        let chunk = '';
        for (const text of texts) {
            if (chunk.length + text.length > 2000) {
                await message.reply(chunk + '\n');
                chunk = '';
            } else {
                chunk += text + '\n';
            }
        }
        await message.reply(chunk);
    } else {
        await message.reply(completion.content);
    }

    await Logger.put({
        guild_id: message.guild?.id,
        channel_id: message.channel.id,
        user_id: message.author.id,
        level: LogLevel.INFO,
        event: 'ChatGPT',
        message: [
            `ResponseId: ${response.id}`,
            `Usage: ${JSON.stringify(response.usage)}`,
            `Model: ${response.model}`,
            `Response:`,
            `${completion.content}`
        ]
    });
}

export async function deleteChatData(message: Message, idx?: string) {
    const { id } = getIdInfo(message);

    const gpt = gptList.gpt.find(c => c.id === id);
    if (!gpt) {
        return;
    }

    if (idx != undefined) {
        const eraseData = gpt.chat[gpt.chat.length - 1];
        gpt.chat.splice(gpt.chat.length - 1, 1);

        const send = new EmbedBuilder()
            .setColor('#00cc00')
            .setTitle(`直前の会話データを削除したよ～！`)
            .setDescription(`会話データ: \ncid: ${gpt.id}\nmessage: ${eraseData.content}`);
        await message.reply({ embeds: [send] });
        return;
    }
    gptList.gpt = gptList.gpt.filter((c) => c.id !== id);
    Logger.put({
        guild_id: message.guild?.id,
        channel_id: message.channel.id,
        user_id: message.author.id,
        level: LogLevel.INFO,
        event: 'ChatGPT',
        message: [
            `Delete: ${gpt.id}`
        ]
    });
    await message.reply('会話データを削除したよ～！');
}

function getIdInfo(message: Message) {
    const guild = message.guild;
    if (!guild) {
        return { id: message.channel.id, isGuild: false, };
    }
    return { id: guild.id, isGuild: true, };
}