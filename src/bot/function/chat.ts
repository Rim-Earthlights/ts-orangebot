import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import dayjs from 'dayjs';
import { GPTMode, Role, gptList, initalize } from '../../constant/chat/chat.js';
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
    mode: GPTMode
    ) {
    const { id, isGuild } = getIdInfo(interaction);
    if (!id) {
        return;
    }
    let gpt = gptList.gpt.find(c => c.id === id);
    if (!gpt) {
        gpt = await initalize(id, model, mode, isGuild);
        gptList.gpt.push(gpt);
    }
    const openai = gpt.openai;

    const systemContent = {
        user: [{ mention_id: `<@${interaction.user.id}>`, name: interaction.user.displayName }],
        date: dayjs().format('YYYY/MM/DD HH:mm:ss'),
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
        await interaction.editReply({ embeds: [send] });
        return;
    }

    gpt.chat.push({ role: Role.ASSISTANT, content: completion.content });
    gpt.timestamp = dayjs();

    if (completion.content.length > 2000) {
        const texts = completion.content.split('\n');
        let message = '';
        const chunks = [];
        for (const text of texts) {
            if (chunks[chunks.length - 1].length + text.length > 2000) {
                chunks.push(message);
                message = text + '\n';
            } else {
                message += text + '\n';
            }
        }
        await interaction.editReply(chunks.shift() ?? 'no response');
        for (const chunk of chunks) {
            await interaction.followUp({ content: chunk });
        }
    } else {
        await interaction.editReply(completion.content);
    }
    await Logger.put({
        guild_id: interaction.guild?.id,
        channel_id: interaction.channel?.id,
        user_id: interaction.user.id,
        level: LogLevel.INFO,
        event: 'ChatGPT',
        message: [
            `responseId: ${response.id}`,
            `Usage: ${JSON.stringify(response.usage)}`,
            `Model: ${response.model}`,
            `Response: `,
            `${completion.content}`
        ]
    });
}

/**
 * ChatGPTの会話データの削除
 */
export async function deleteChatData(interaction: ChatInputCommandInteraction<CacheType>, lastFlag?: boolean) {
    const { id } = getIdInfo(interaction);
    if (!id) {
        return;
    }
    const gpt = gptList.gpt.find(c => c.id === id);
    if (!gpt) {
        return;
    }

    if (lastFlag) {
        const eraseData = gpt.chat[gpt.chat.length - 1];
        gpt.chat.splice(gpt.chat.length - 1, 1);

        const send = new EmbedBuilder()
            .setColor('#00cc00')
            .setTitle(`直前の会話データを削除したよ～！`)
            .setDescription(`会話データ: \nid: ${gpt.id}\nmessage: ${eraseData.content}`);
        await interaction.reply({ embeds: [send] });
        return;
    }
    gptList.gpt = gptList.gpt.filter((c) => c.id !== id);
    Logger.put({
        guild_id: interaction.guild?.id,
        channel_id: interaction.channel?.id,
        user_id: interaction.user.id,
        level: LogLevel.INFO,
        event: 'ChatGPT',
        message: [
            `Delete: ${gpt.id}`
        ]
    });
    await interaction.reply('会話データを削除したよ～！');
}

function getIdInfo(interaction: ChatInputCommandInteraction<CacheType>) {
    const guild = interaction.guild;
    if (!guild) {
        return { id: interaction.channel?.id ?? interaction.user.dmChannel?.id, isGuild: false, };
    }
    return { id: guild.id, isGuild: true, };
}