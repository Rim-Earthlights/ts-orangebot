/**
 * ChatGPT
 */
import * as logger from '../../common/logger.js';
import { CHATBOT_TEMPLATE } from '../../constant/constants.js';
import { CacheType, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js';
import dayjs from 'dayjs';
import { AxiosError } from 'axios';
import { ChatGPTModel, initalize } from '../../constant/chat/chat.js';

/**
 * ChatGPTで会話する
 */
export const talk = async (
    interaction: ChatInputCommandInteraction<CacheType>,
    content: string,
    model: ChatGPTModel
) => {
    // サーバー内のテキストチャンネル以外は無視
    if (!interaction.guild) {
        return;
    }

    // ChatGPT初期化
    const chat = await initalize(interaction.guild.id, 'default', model);

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
        user: (interaction.member as GuildMember).nickname ?? interaction.user.username ?? 'system'
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
            interaction.guild.id,
            'ChatGPT',
            `ParentId: ${parentMessageId}\nUsage: ${JSON.stringify(response.detail?.usage)}\nModel: ${
                response.detail?.model
            }\nResponse: \n${response.text}`
        );
        await interaction.editReply(response.text);
    } catch (err) {
        const error = err as AxiosError;
        if (error.response?.status === 500) {
            const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(error.message);
            await interaction.editReply({ embeds: [send] });
        }
    }
};

/**
 * ChatGPTの会話データの削除
 */
export const deleteChatData = async (interaction: ChatInputCommandInteraction<CacheType>, lastFlag?: boolean) => {
    // サーバー内のテキストチャンネル以外は無視
    if (!interaction.guild) {
        return;
    }

    // ChatGPT初期化
    const chat = await initalize(interaction.guild.id);

    if (lastFlag) {
        const eraseData = chat.parentMessageId[chat.parentMessageId.length - 1];
        chat.parentMessageId.splice(chat.parentMessageId.length - 1, 1);

        const send = new EmbedBuilder()
            .setColor('#00cc00')
            .setTitle(`直前の会話データを削除したよ～！`)
            .setDescription(`会話データ: \ncid: ${eraseData.cid}\nid: ${eraseData.id}\nmessage: ${eraseData.message}`);
        await interaction.reply({ embeds: [send] });
        return;
    }
    chat.parentMessageId = [];
    await interaction.reply('会話データを削除したよ～！');
};
