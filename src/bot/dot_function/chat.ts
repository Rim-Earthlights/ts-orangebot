import { EmbedBuilder, Message } from 'discord.js';
import dayjs from 'dayjs';
import axios, { AxiosError } from 'axios';
import { ChatGPTModel, GPTMode, initalize } from '../../constant/chat/chat.js';
import { Logger } from '../../common/logger.js';
import { LogLevel } from '../../type/types.js';
import { CONFIG } from '../../config/config.js';

/**
 * ChatGPTで会話する
 */
export async function talk(
    message: Message,
    content: string,
    model: ChatGPTModel,
    mode: GPTMode = GPTMode.DEFAULT,
    retryCount = 0
) {
    const id = message.guild?.id ?? message.author.id;

    // ChatGPTが初期化されていない場合は初期化
    const chat = await initalize(id, Boolean(!message.guild), mode, model);
    if (chat.mode !== mode) {
        chat.messages = [];
        chat.mode = mode;
    }

    let parentMessageId: string | undefined = undefined;
    if (chat.messages.length > 0) {
        parentMessageId = chat.messages[chat.messages.length - 1].id;
    }

    const systemContent = {
        date: dayjs().format('YYYY/MM/DD HH:mm:ss'),
        user: message.member?.nickname ?? message.author.username ?? 'system'
    };

    const sendContent = `${JSON.stringify(systemContent)}\n${content}`;

    try {
        const response = await chat.GPT.sendMessage(sendContent, {
            parentMessageId: parentMessageId
        });
        chat.messages.push({ id: response.id, message: content });
        chat.timestamp = dayjs();
        await Logger.put({
            guild_id: message.guild?.id,
            channel_id: message.channel.id,
            user_id: message.author.id,
            level: LogLevel.INFO,
            event: 'ChatGPT',
            message: [
                `ParentId: ${parentMessageId}, ResponseId: ${response.id}`,
                `Usage: ${JSON.stringify(response.detail?.usage)}`,
                `Model: ${response.detail?.model}`,
                `Response:`,
                `${response.text}`
            ]
        });
        await message.reply(response.text);
    } catch (err) {
        const error = err as AxiosError;
        if (error.response?.status === 500) {
            const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(error.message);
            await message.reply({ embeds: [send] });
        }

        if (error.response?.status === 502) {
            // 502 Bad Gateway
            if (retryCount > 2) {
                const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(error.message);
                await message.reply({ embeds: [send] });
                return;
            }
            setTimeout(() => null, 200);
            await talk(message, content, model, mode);
            return;
        }

        const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(error.message);
        await message.reply({ embeds: [send] });
    }
}

export async function generatePicture(message: Message, prompt: string): Promise<void> {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/images/generations',
            {
                prompt: prompt,
                n: 1,
                response_format: 'url',
                size: '1024x1024'
            },
            {
                headers: { Authorization: `Bearer ${CONFIG.OPENAI.KEY}` }
            }
        );

        const data = response.data as PictureResponse;

        const send = new EmbedBuilder().setColor('#00cccc').setTitle(`生成写真`).setImage(data.data[0].url);

        message.reply({ embeds: [send] });
    } catch (e) {
        const error = e as Error;
        message.reply(error.message);
    }
}

/**
 * ChatGPTの会話データの削除
 */
export async function deleteChatData(message: Message, idx?: string) {
    const id = message.guild?.id ?? message.author.id;

    // ChatGPT初期化
    const chat = await initalize(id, Boolean(!message.guild));

    if (idx != undefined) {
        const eraseData = chat.messages[chat.messages.length - 1];
        chat.messages.splice(chat.messages.length - 1, 1);

        const send = new EmbedBuilder()
            .setColor('#00cc00')
            .setTitle(`直前の会話データを削除したよ～！`)
            .setDescription(`会話データ: \ncid: ${eraseData.cid}\nid: ${eraseData.id}\nmessage: ${eraseData.message}`);
        await message.reply({ embeds: [send] });
        return;
    }
    chat.messages = [];
    await message.reply('会話データを削除したよ～！');
}

type PictureResponse = {
    created: Date;
    data: {
        url: string;
    }[];
};
