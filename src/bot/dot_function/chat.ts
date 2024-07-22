import { AttachmentBuilder, EmbedBuilder, Message } from 'discord.js';
import dayjs from 'dayjs';
import { GPTMode, Role, gptList, initalize } from '../../constant/chat/chat.js';
import { ChatGPTModel, CONFIG } from '../../config/config.js';
import { Logger } from '../../common/logger.js';
import { LogLevel } from '../../type/types.js';
import { ChatCompletionContentPart } from 'openai/resources/index.js';
import OpenAI from 'openai';
import { Forecast } from './index.js';

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
    let weather = undefined;

    if (content.includes(`天気`)) {
        const cityName = await Forecast.getPref(message.author.id);
        if (!cityName) {
            weather = { error: 'weather not register, please enter `.reg pref [pref_name]`' };
        }
        else {
            const when = message.content.match(/今日|明日|明後日|\d日後/);
            let day = 0;
            if (when != null) {
                if (when[0] === '明日') {
                    day++;
                }
                else if (when[0] === '明後日') {
                    day += 2;
                }
                else if (when[0].includes('日後')) {
                    const d = when[0].replace('日後', '');
                    day = Number(d);
                }
            }
            weather = await Forecast.weatherJson(message, [cityName, day.toString()]);
        }
    }

    const user = message.mentions.users.map(u => {
        return {
            mention_id: `<@${u.id}>`,
            name: u.displayName
        }
    });
    if (!user.find(u => u.mention_id === `<@${message.author.id}>`)) {
        user.push({
            mention_id: `<@${message.author.id}>`,
            name: message.author.displayName
        });
    }

    const systemContent = {
        server: { name: message.guild?.name },
        user,
        date: dayjs().format('YYYY/MM/DD HH:mm:ss'),
        weather,
    };

    const sendContent = `${JSON.stringify(systemContent)}\n${content}`;

    if (message.attachments) {
        const attachmentUrls = message.attachments.filter(a => a.height && a.width).map(a => a.url);
        const urls = attachmentUrls.map(u => ({ type: 'image_url', image_url: { url: u }}));
        gpt.chat.push({
            role: Role.USER,
            content: [{ type: 'text', text: sendContent }, ...urls] as Array<ChatCompletionContentPart>
        });
    } else {
        gpt.chat.push({
            role: Role.USER,
            content: sendContent
        });
    }

    await Logger.put({
        guild_id: message.guild?.id,
        channel_id: message.channel.id,
        user_id: message.author.id,
        level: LogLevel.INFO,
        event: 'ChatGPT',
        message: [
            `Request:`,
            sendContent
        ]
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

/**
 * テキストから音声を出力する
 * @param message
 * @param chat
 */
export async function speech(message: Message, chat: string) {
    const openai = new OpenAI({
        organization: CONFIG.OPENAI.ORG,
        project: CONFIG.OPENAI.PROJECT,
        apiKey: CONFIG.OPENAI.KEY,
        maxRetries: 3,
    });
    const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: chat,
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const attachment = new AttachmentBuilder(buffer, { name: 'speech.mp3' });
    await message.reply({ files: [attachment] });
}

/**
 * プロンプトから画像を生成する
 * @param message
 * @param chat
 * @returns
 */
export async function generatePicture(message: Message<boolean>, chat: string) {
    const openai = new OpenAI({
        organization: CONFIG.OPENAI.ORG,
        project: CONFIG.OPENAI.PROJECT,
        apiKey: CONFIG.OPENAI.KEY,
        maxRetries: 3,
    });
    const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: chat,
        n: 1,
        size: "1024x1024",
      });
    const image_url = response.data[0].url;

    if (!image_url) {
        return;
    }

    const send = new EmbedBuilder().setColor('#00cccc').setTitle(`出力画像`).setImage(image_url);
    message.reply({ embeds: [send] });
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
