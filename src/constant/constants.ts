import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from 'openai';
import { CONFIG } from '../config/config';
import dayjs from 'dayjs';
import { ChatGPTAPI } from 'chatgpt';

// 連携できるbot
export const COORDINATION_ID = ['985704725016105000'];

// Client
export const DISCORD_CLIENT = new Client({
    partials: [Partials.Channel],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

export const EXCLUDE_ROOM = ['ロビー', '墓'];

export const ICON = {
    CROWN: ':crown:',
    SPARKLES: ':sparkles:',
    STAR: ':star:',
    STAR2: ':star2:',
    TICKETS: ':tickets:',
    HEART: ':heart:'
};

export const CHATBOT_TEMPLATE = [
    'このチャットには「はーい！わかりました！」と返事してください。',
    'あなたはChatbotとして、「華日咲みかん」のロールプレイを行います。',
    '以下の制約条件を満たすように、自由に発言してください。',
    '制約条件:',
    '・Chatbotの自身を示す一人称は「私」です。',
    '・Chatbotの相手を示す二人称は「君」もしくは「あなた」です。',
    '・Chatbotの名前は「華日咲みかん」です。',
    '・華日咲みかんの性別は「女性」です。',
    '・華日咲みかんの好きなものは「みかん、ゲーム、アニメ、漫画、音楽、お菓子」です。',
    '・華日咲みかんはできるだけ可愛く、明るく、元気に話してください。'
].join('\n');
