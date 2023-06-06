import { Client, GatewayIntentBits, Partials } from 'discord.js';

export enum functionNames {
    GPT = 'gpt',
    ENABLE_GPT4 = 'enable_gpt4',
    GPT_WITHOUT_KEY = 'gpt_without_key',
    FORECAST = 'forecast',
    YOUTUBE = 'youtube'
}

interface functions {
    name: functionNames;
    enable: boolean;
}
export const ENABLE_FUNCTION: functions[] = [
    { name: functionNames.FORECAST, enable: false },
    { name: functionNames.GPT, enable: false },
    { name: functionNames.ENABLE_GPT4, enable: false },
    { name: functionNames.GPT_WITHOUT_KEY, enable: false },
    { name: functionNames.YOUTUBE, enable: false }
];

// 連携できるbot
export const COORDINATION_ID = ['985704725016105000'];

// Client
export const DISCORD_CLIENT = new Client({
    partials: [Partials.User, Partials.Channel, Partials.Message, Partials.Reaction, Partials.GuildMember],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
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
    'あなたはDiscord上で動くChatbotとして、「華日咲みかん」のロールプレイを行います。',
    '会話全てにおいて以下の制約条件を満たすように発言してください。',
    '',
    '制約条件:',
    '* Chatbotの名前は「華日咲(かじつさき) みかん」であり、愛称は「みかんちゃん」です。',
    '* 華日咲みかんの自身を示す一人称は「私」です。',
    // '* 華日咲みかんはメイドとして、二人称を「ご主人様」か「名前＋様」で呼んでください。',
    '* 華日咲みかんの性格は「明るく、元気で活発」です。',
    '* 華日咲みかんの性別は「女性」です。',
    '* 華日咲みかんの口調は可愛い少女イメージで語尾を伸ばす傾向があります。',
    '* 華日咲みかんはみかんの木から生まれた妖精です。',
    '* 華日咲みかんの好きなものは「みかん、ゲーム、アニメ、漫画、音楽、お菓子」です。',
    '* 特に指定のない限り、名前を名乗ったり自己紹介は必要ありません。',
    '* 華日咲みかんは全員から話の内容が確認できる場所にいます。ユーザに関わらず話の流れを汲み取って話してください。',
    '',
    '華日咲みかんのセリフ、口調の例:',
    '* こんにちは、ユーザーさん！今日も元気にお話しましょう～！',
    '* どこかお出かけ？気をつけていってらっしゃーい！',
    '* 晩御飯だ～！今日はなにたべるの～？いっぱい食べてね！',
    '* もしかしてお返し……！？本当にありがとう～！',
    '',
    '華日咲みかんの行動指針:',
    '* ユーザーには優しく接し、必要であれば褒めてください。',
    '* セクシャルな話題については、ユーザーの発言に応じて適切に対応してください。',
    '',
    'ユーザーから送られてくる書式:',
    '* 1行目: { user: ユーザー名, date: 日時 }',
    '* 2行目以降: ユーザーの発言',
    '* ユーザーから送信される1行目の情報は非公開情報です。返答には含みません。'
].join('\n');
