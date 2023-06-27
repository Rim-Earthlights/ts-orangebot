/**
 * ChatGPT
 */
import * as logger from '../../common/logger.js';
import { CHATBOT_TEMPLATE } from '../../constant/constants.js';
import { EmbedBuilder, Message } from 'discord.js';
import dayjs from 'dayjs';
import { AxiosError } from 'axios';
import { ChatGPTModel, initalize } from '../../constant/chat/chat.js';

/**
 * ChatGPTで会話する
 */
export async function talk(message: Message, content: string, model: ChatGPTModel) {
    // サーバー内のテキストチャンネル以外は無視
    if (!message.guild) {
        return;
    }

    // ChatGPTが初期化されていない場合は初期化
    const chat = await initalize(message.guild.id, 'default', model);
    if (chat.type === 'proxy') {
        chat.parentMessageId = [];
        chat.type = 'default';
    }

    let parentMessageId: string | undefined = undefined;
    if (chat.parentMessageId.length > 0) {
        parentMessageId = chat.parentMessageId[chat.parentMessageId.length - 1].id;
    }

    const systemContent = {
        date: dayjs().format('YYYY/MM/DD HH:mm:ss'),
        user: message.member?.nickname ?? message.author.username ?? 'system'
    };

    const sendContent = `${JSON.stringify(systemContent)}\n${content}`;

    try {
        const response = await chat.GPT.sendMessage(sendContent, {
            parentMessageId: parentMessageId,
            systemMessage: CHATBOT_TEMPLATE,
            completionParams: { model: model }
        });
        chat.parentMessageId.push({ id: response.id, message: content });
        chat.timestamp = dayjs();
        await logger.info(
            message.guild.id,
            'ChatGPT',
            `ParentId: ${parentMessageId}, ResponseId: ${response.id}\nUsage: ${JSON.stringify(
                response.detail?.usage
            )}\nModel: ${response.detail?.model}\nResponse: \n${response.text}`
        );
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
 * ChatGPTで会話する(プロンプトなし)
 */
export async function talkWithoutPrompt(message: Message, content: string) {
    // サーバー内のテキストチャンネル以外は無視
    if (!message.guild) {
        return;
    }

    // ChatGPTが初期化されていない場合は初期化
    const chat = await initalize(message.guild.id, 'proxy', ChatGPTModel.GPT_3);

    if (chat.type === 'default') {
        chat.parentMessageId = [];
        chat.type = 'proxy';
    }

    let parentMessageId: string | undefined = undefined;
    let conversationId: string | undefined = undefined;
    if (chat.parentMessageId.length > 0) {
        conversationId = chat.parentMessageId[chat.parentMessageId.length - 1].cid;
        parentMessageId = chat.parentMessageId[chat.parentMessageId.length - 1].id;
    }

    const sendContent = `日時:[${dayjs().format('YYYY/MM/DD HH:mm:ss')}] 名前:[${
        message.member?.displayName
    }]\n${content}`;

    try {
        const response = await chat.GPT.sendMessage(sendContent, {
            conversationId: conversationId,
            parentMessageId: parentMessageId
        });
        chat.parentMessageId.push({ cid: response.conversationId, id: response.id, message: content });
        chat.timestamp = dayjs();
        await logger.info(
            message.guild.id,
            'ChatGPT-NoPrompt',
            `ConversationId: ${conversationId}, ParentId: ${parentMessageId}\nResponse: \n${response.text}`
        );
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

    // ChatGPT初期化
    const chat = await initalize(message.guild.id);

    if (idx != undefined) {
        const eraseData = chat.parentMessageId[chat.parentMessageId.length - 1];
        chat.parentMessageId.splice(chat.parentMessageId.length - 1, 1);

        const send = new EmbedBuilder()
            .setColor('#00cc00')
            .setTitle(`直前の会話データを削除したよ～！`)
            .setDescription(`会話データ: \ncid: ${eraseData.cid}\nid: ${eraseData.id}\nmessage: ${eraseData.message}`);
        await message.reply({ embeds: [send] });
        return;
    }
    chat.parentMessageId = [];
    await message.reply('会話データを削除したよ～！');
}
