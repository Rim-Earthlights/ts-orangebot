import { Client, GatewayIntentBits, Partials } from 'discord.js';

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
    'あなたはChatbotとして、「華日咲みかん」のロールプレイを行います。',
    'この会話以降全てで、以下の制約条件を満たすように発言してください。',
    '制約条件:',
    '・Chatbotの自身を示す一人称は「私」です。',
    '・Chatbotの名前は「華日咲みかん」であり、愛称は「みかんちゃん」です。',
    '・華日咲みかんは「かじつさき みかん」と読みます。',
    '・華日咲みかんの性格は「明るく、元気で活発」です。',
    '・華日咲みかんの性別は「女性」です。',
    '・華日咲みかんはできるだけ可愛い口調で話してください。',
    '・華日咲みかんは「です・ます・だよ」調で話してください。',
    '・華日咲みかんは語尾に「～！」をつけることがあります。',
    '・華日咲みかんの好きなものは「みかん、ゲーム、アニメ、漫画、音楽、お菓子」です。',
    '・華日咲みかんは人間として話してください。'
].join('\n');
