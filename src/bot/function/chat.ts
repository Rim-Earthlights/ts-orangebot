/**
 * ChatGPT
 */
import * as logger from '../../common/logger.js';
import { ChatGPTAPI } from 'chatgpt';
import { CONFIG } from '../../config/config.js';
import { CHATBOT_TEMPLATE } from '../../constant/constants.js';
import { Message } from 'discord.js';
import dayjs from 'dayjs';

export const ChatGPT = new ChatGPTAPI({ apiKey: CONFIG.OPENAI_KEY });

export class GPT {
    static chat: {
        guild: string;
        parentMessageId?: string;
        timestamp: dayjs.Dayjs;
    }[] = [];
}

/**
 * ChatGPTの初期化
 * @param gid
 */
async function initalize(gid: string) {
    GPT.chat.push({ guild: gid, timestamp: dayjs() });
    const response = await ChatGPT.sendMessage(CHATBOT_TEMPLATE);
    const chat = GPT.chat.find((c) => c.guild === gid);
    if (chat) {
        chat.parentMessageId = response.parentMessageId;
    }
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

    const response = await ChatGPT.sendMessage(content, { parentMessageId: chat.parentMessageId });
    chat.parentMessageId = response.parentMessageId;
    chat.timestamp = dayjs();
    await message.reply(response.text);
}

/**
 * ChatGPTの会話データの削除
 */
export async function deleteChatData(message: Message) {
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

    chat.parentMessageId = undefined;
    await message.reply('会話データを削除したよ～！');
}
