import { CacheType, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js';
import dayjs from 'dayjs';
import { AxiosError } from 'axios';
import { GPTMode, initalize } from '../../constant/chat/chat.js';
import { Logger } from '../../common/logger.js';
import { LogLevel } from '../../type/types.js';
import { ChatGPTModel } from '../../config/config.js';

/**
 * ChatGPTで会話する
 */
export async function talk(
    interaction: ChatInputCommandInteraction<CacheType>,
    content: string,
    model: ChatGPTModel,
    retryCount = 0
) {
    const id = interaction.guild?.id ?? interaction.user.id;

    // ChatGPT初期化
    const chat = await initalize(id, Boolean(!interaction.guild), GPTMode.DEFAULT, model);

    if (chat.mode !== GPTMode.DEFAULT) {
        chat.messages = [];
        chat.mode = GPTMode.DEFAULT;
    }

    let parentMessageId: string | undefined = undefined;
    if (chat.messages.length > 0) {
        parentMessageId = chat.messages[chat.messages.length - 1].id;
    }

    const systemContent = {
        date: dayjs().format('YYYY/MM/DD HH:mm:ss'),
        user: `<@${interaction.user.id}>`
    };

    const sendContent = `${JSON.stringify(systemContent)}\n${content}`;

    try {
        const response = await chat.GPT.sendMessage(sendContent, {
            parentMessageId: parentMessageId
        });
        chat.messages.push({ id: response.id, message: content });
        chat.timestamp = dayjs();
        await Logger.put({
            guild_id: interaction.guild?.id,
            channel_id: interaction.channel?.id,
            user_id: interaction.user.id,
            level: LogLevel.INFO,
            event: 'ChatGPT',
            message: [
                `ParentId: ${parentMessageId}`,
                `Usage: ${JSON.stringify(response.detail?.usage)}`,
                `Model: ${response.detail?.model}`,
                `Response: `,
                `${response.text}`
            ]
        });
        await interaction.editReply(response.text);
    } catch (err) {
        const error = err as AxiosError;
        if (error.response?.status === 500) {
            const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(error.message);
            await interaction.editReply({ embeds: [send] });
        }
        if (error.response?.status === 502) {
            // 502 Bad Gateway
            if (retryCount > 2) {
                const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(error.message);
                await interaction.editReply({ embeds: [send] });
                return;
            }
            setTimeout(() => null, 200);
            await talk(interaction, content, model);
            return;
        }
    }
}

/**
 * ChatGPTの会話データの削除
 */
export async function deleteChatData(interaction: ChatInputCommandInteraction<CacheType>, lastFlag?: boolean) {
    const id = interaction.guild?.id ?? interaction.user.id;

    // ChatGPT初期化
    const chat = await initalize(id, Boolean(!interaction.guild));

    if (lastFlag) {
        const eraseData = chat.messages[chat.messages.length - 1];
        chat.messages.splice(chat.messages.length - 1, 1);

        const send = new EmbedBuilder()
            .setColor('#00cc00')
            .setTitle(`直前の会話データを削除したよ～！`)
            .setDescription(`会話データ: \ncid: ${eraseData.cid}\nid: ${eraseData.id}\nmessage: ${eraseData.message}`);
        await interaction.reply({ embeds: [send] });
        return;
    }
    chat.messages = [];
    await interaction.reply('会話データを削除したよ～！');
}
