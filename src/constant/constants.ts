import { Client, EmbedBuilder, GatewayIntentBits, Partials } from 'discord.js';

/**
 * 有効化する機能
 */
export enum functionNames {
    GPT = 'gpt',
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

export const HELP_COMMANDS = [
    new EmbedBuilder()
        .setColor('Aqua')
        .setTitle('便利コマンド系')
        .addFields(
            {
                name: '.help',
                value: 'このヘルプを表示します'
            },
            {
                name: '.tenki [地域] [?日数]',
                value: '天気予報を取得する\n指定した地域の天気予報を取得します\n日数を指定するとその日数後の天気予報を取得します(6日後まで)'
            },
            {
                name: '.reg [pref | birth] [登録名]',
                value: [
                    'ユーザー情報を登録します',
                    'pref: 都道府県を登録します (例: [.reg pref 東京都])',
                    'name: 名前を登録します (例: [.reg name ほげほげ])',
                    'birth: 誕生日を登録します (例: [.reg birth 0101] (1月1日生まれ))'
                ].join('\n')
            },
            {
                name: '.dice [ダイスの振る数] [ダイスの面の数]',
                value: 'サイコロを振ります (例: [.dice 5 6] (6面体ダイスを5個振る))'
            },
            {
                name: '.dall',
                value: 'ボイスチャットにいる人全員で100面サイコロを振ります.\nなにか決めたいときに使えるかも'
            },
            {
                name: '.team [チーム数] [?move]',
                value: [
                    'ボイスチャットにいる人全員をチーム数で分けます',
                    'moveを指定するとチーム分け後にメンバーを移動します'
                ].join('\n')
            },
            { name: '.room [?部屋名]', value: 'お部屋の名前を変更します\n部屋名の入力がない場合は初期値に戻します' },
            { name: '.choose [選択肢1] [選択肢2] ...', value: '選択肢をスペース区切りで入力するとランダムに選びます' }
        ),
    new EmbedBuilder()
        .setColor('Aqua')
        .setTitle('ガチャ系')
        .addFields(
            {
                name: '.gacha [?回数 or limit] | .g [?回数 or l]',
                value: [
                    '10連ガチャを引く(0時に可能回数が10回(上限70まで)増えます)',
                    '回数を指定するとその回数分ガチャを引きます',
                    'limitを指定した場合は今の上限数まで自動で引きます'
                ].join('\n')
            },
            {
                name: '.gl',
                value: '.gacha limitの短縮形です. 今の上限数まで自動で引きます'
            },
            {
                name: '.gp',
                value: '現在のガチャ確率を表示します'
            },
            {
                name: '.luck',
                value: '今日の運勢を占います. 結果に特に意味はないです'
            }
        ),
    new EmbedBuilder().setColor('Aqua').setTitle('みかんと遊ぶ系').addFields(
        {
            name: '.celo',
            value: 'チンチロリンを振ります. 3回まで振って役が出たら終わります'
        },
        {
            name: '.celovs',
            value: 'みかんちゃんとチンチロリンで遊びます.'
        }
    ),
    new EmbedBuilder().setColor('Aqua').setTitle('おしゃべり系').addFields(
        {
            name: '.gpt [text] | /gpt [text]',
            value: 'おしゃべり(GPT-4 / 8K tokens)\nみかんちゃんとChatGPTを使ったおしゃべりができます'
        },
        {
            name: '.g3 [text] | /g3 [text]',
            value: 'おしゃべり(GPT-3 / 16K tokens)\nみかんちゃんとChatGPTを使ったおしゃべりができます'
        },
        {
            name: '.g4 [text] | /g4 [text]',
            value: 'おしゃべり(GPT-4 / 32K tokens)\nみかんちゃんとChatGPTを使ったおしゃべりができます'
        }
    ),
    new EmbedBuilder()
        .setColor('Aqua')
        .setTitle('読み上げ系(れもんちゃん)')
        .addFields(
            {
                name: '.speak',
                value: '読み上げを開始します'
            },
            {
                name: '.speaker-config [ボイス番号] [速度]',
                value: [
                    '読み上げのユーザー設定を変更します',
                    '読み上げ番号は`http://rim-linq.net:4044/speakers`で確認できます',
                    '速度は(0.1 - 5.0 | 整数可)で指定できます'
                ].join('\n')
            },
            {
                name: '.discon',
                value: '読み上げを終了します'
            }
        ),
    new EmbedBuilder()
        .setColor('Aqua')
        .setTitle('音楽再生系')
        .addFields(
            {
                name: '.play [URL] | .pl [URL]',
                value: 'Youtube の音楽を再生します. プレイリストも可能'
            },
            {
                name: '.search [検索ワード] | .sc [検索ワード]',
                value: 'Youtube から検索して音楽を追加/再生します'
            },
            {
                name: '.interrupt [URL] | .pi [URL]',
                value: '曲を1番目に割り込んで予約する'
            },
            {
                name: '.interrupt [予約番号] | .pi [予約番号]',
                value: '予約されている曲を1番目に割り込んで予約する'
            },
            {
                name: '.stop | .st',
                value: '現在再生中の音楽を止める(次がある場合は次を再生する)'
            },
            {
                name: '.shuffle | .sf',
                value: '現在のキューの音楽をシャッフルする'
            },
            {
                name: '.rem [予約番号] | .rm [予約番号]',
                value: '予約されている曲を削除する'
            },
            {
                name: '.rem all | .rm all',
                value: '予約している曲を全て削除し、音楽再生を中止する'
            },
            {
                name: '.q',
                value: '現在のキューを表示する'
            },
            {
                name: '.silent | .si',
                value: [
                    '音楽再生の通知を切り替えます',
                    'offの場合は次の曲に変わっても通知しなくなりますが, 自動シャッフル時にのみ通知されます'
                ].join('\n')
            },
            {
                name: '.mode [lp or sf]',
                value: ['音楽再生のモードをON/OFFに切り替えます', 'lp: ループ再生', 'sf: シャッフル再生'].join('\n')
            },
            {
                name: '.seek [時間 分:秒 or 秒数]',
                value: '現在の曲の再生位置を変更します. 例) `.seek 1:30` or `.seek 90`'
            },
            {
                name: '.pause',
                value: '現在の曲を`一時停止` or `再開`します'
            }
        ),
    new EmbedBuilder().setColor('Aqua').setTitle('プレイリスト系').addFields(
        {
            name: '.list',
            value: '登録されているプレイリストの一覧を表示します'
        },
        {
            name: '.list add [名前] [URL]',
            value: 'プレイリストを登録します'
        },
        {
            name: '.list rem [名前] | .list rm [名前]',
            value: 'プレイリストを削除します'
        },
        {
            name: '.list loop [名前] [on | off] | .list lp [名前] [on | off]',
            value: '対象プレイリストのループ処理を書き換えます'
        },
        {
            name: '.list shuffle [名前] [on | off] | .list sf [名前] [on | off]',
            value: '対象プレイリストの自動シャッフル処理を書き換えます'
        }
    )
];

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
    '* 特に指定のない限り、華日咲みかんの自己紹介は必要ありません。',
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
