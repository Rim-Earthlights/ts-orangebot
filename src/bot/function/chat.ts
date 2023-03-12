/**
 * ChatGPT
 */
import * as logger from '../../common/logger.js';
import { ChatGPTAPI } from 'chatgpt';
import { CONFIG } from '../../config/config.js';
import { CHATBOT_TEMPLATE } from '../../constant/constants.js';
import { EmbedBuilder, Message } from 'discord.js';
import dayjs from 'dayjs';
import { AxiosError } from 'axios';

const ChatGPT = new ChatGPTAPI({ apiKey: CONFIG.OPENAI_KEY, completionParams: { model: 'gpt-3.5-turbo' } });
const ChatGPT_NOSYSTEM = new ChatGPTAPI({
    apiKey: CONFIG.OPENAI_KEY,
    completionParams: { model: 'gpt-3.5-turbo' }
});

export class GPT {
    static chat: {
        guild: string;
        parentMessageId: {
            id: string;
            message: string;
        }[];
        timestamp: dayjs.Dayjs;
    }[] = [];
}

/**
 * ChatGPTの初期化
 * @param gid
 */
async function initalize(gid: string) {
    GPT.chat.push({ guild: gid, parentMessageId: [], timestamp: dayjs() });
}

/**
 * ChatGPTで会話する
 */
export async function talk(message: Message, content: string) {
    // サーバー内のテキストチャンネル以外は無視
    if (!message.guild) {
        return;
    }

    // ChatGPTが初期化されていない場合は初期化
    let chat = GPT.chat.find((c) => c.guild === message.guild?.id);
    if (!chat) {
        await initalize(message.guild.id);

        chat = GPT.chat.find((c) => c.guild === message.guild?.id);
        if (!chat) {
            logger.error('system', 'ChatGPT', 'ChatGPT initialization failed');
            return;
        }
    }
    let parentMessageId: string | undefined = undefined;
    if (chat.parentMessageId.length > 0) {
        parentMessageId = chat.parentMessageId[chat.parentMessageId.length - 1].id;
    }

    const sendContent = `日時:[${dayjs().format('YYYY/MM/DD HH:mm:ss')}] 名前:[${
        message.member?.displayName
    }]\n${content}`;

    try {
        const response = await ChatGPT.sendMessage(sendContent, {
            parentMessageId: parentMessageId,
            systemMessage: CHATBOT_TEMPLATE
        });
        chat.parentMessageId.push({ id: response.id, message: content });
        chat.timestamp = dayjs();
        logger.info(message.guild.id, 'ChatGPT', `Response: \n${response.text}`);
        await message.reply(response.text);
    } catch (err) {
        const error = err as AxiosError;
        if (error.response?.status === 500) {
            const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(error.message);
            await message.reply({ embeds: [send] });
        }
    }
}

/**
 * systemMessageを指定してChatGPTで会話する
 */
export async function talkCustomSystemMessage(message: Message, content: string) {
    // サーバー内のテキストチャンネル以外は無視
    if (!message.guild) {
        return;
    }

    // ChatGPTが初期化されていない場合は初期化
    let chat = GPT.chat.find((c) => c.guild === message.guild?.id);
    if (!chat) {
        await initalize(message.guild.id);

        chat = GPT.chat.find((c) => c.guild === message.guild?.id);
        if (!chat) {
            logger.error('system', 'ChatGPT', 'ChatGPT initialization failed');
            return;
        }
    }

    let parentMessageId: string | undefined = undefined;
    if (chat.parentMessageId.length > 0) {
        parentMessageId = chat.parentMessageId[chat.parentMessageId.length - 1].id;
    }

    const sendContent = `日時:[${dayjs().format('YYYY/MM/DD HH:mm:ss')}] 名前:[${
        message.member?.displayName
    }]\n${content}`;

    try {
        const response = await ChatGPT_NOSYSTEM.sendMessage(sendContent, {
            parentMessageId: parentMessageId,
            systemMessage: undefined
        });

        chat.parentMessageId.push({ id: response.id, message: content });
        chat.timestamp = dayjs();
        logger.info(message.guild.id, 'ChatGPT', `Response: \n${response.text}`);
        await message.reply(response.text);
    } catch (err) {
        const error = err as AxiosError;
        if (error.response?.status === 500) {
            const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(error.message);
            await message.reply({ embeds: [send] });
        }
    }
}

/**
 * ChatGPTの会話データの削除
 */
export async function deleteChatData(message: Message, idx?: string) {
    // サーバー内のテキストチャンネル以外は無視
    if (!message.guild) {
        return;
    }

    // ChatGPTが初期化されていない場合は初期化
    let chat = GPT.chat.find((c) => c.guild === message.guild?.id);
    if (!chat) {
        await initalize(message.guild.id);

        chat = GPT.chat.find((c) => c.guild === message.guild?.id);
        if (!chat) {
            logger.error('system', 'ChatGPT', 'ChatGPT initialization failed');
            return;
        }
    }

    if (idx != undefined) {
        const eraseData = chat.parentMessageId[chat.parentMessageId.length - 1];
        chat.parentMessageId.splice(chat.parentMessageId.length - 1, 1);

        const send = new EmbedBuilder()
            .setColor('#00cc00')
            .setTitle(`直前の会話データを削除したよ～！`)
            .setDescription(`会話データ: \nid: ${eraseData.id}\nmessage: ${eraseData.message}`);
        await message.reply({ embeds: [send] });
        return;
    }
    chat.parentMessageId = [];
    await message.reply('会話データを削除したよ～！');
}
