import { Client, GatewayIntentBits, Partials } from 'discord.js';

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
    `今動いている言語は[TypeScript]版だよ！`,
    '',
    'コマンドはここだよ～！',
    '```',
    '(?がついている引数は入力自由です)',
    '===== 便利コマンド系 =====',
    ' * .tenki [地域] [?日数]',
    '   > 天気予報を取得する',
    '   > 指定した地域の天気予報を取得します',
    '   > 日数を指定するとその日数後の天気予報を取得します(6日後まで)',
    ' * .dice [ダイスの振る数] [ダイスの面の数]',
    '   > サイコロを振る (例: [.dice 5 6] (6面体ダイスを5個振る))',
    ' * .dall',
    '   > ボイスチャットにいる人全員で100面サイコロを振る',
    '     なにか決めたいときに使えるかも',
    ' * .choose [選択肢1] [選択肢2]... / .choice ... / .ch ...',
    '   > 選択肢からランダムに選ぶ',
    '   > 選択肢をスペース区切りで入力するとランダムに選んでくれるよ',
    '===== みかんちゃんと遊ぶ系 =====',
    ' * .luck [?運勢]',
    '   > おみくじを引く',
    '     運勢を指定するとその運勢が出るまで引きます',
    ' * .gacha [?回数 or limit] | .g [?回数 or l]',
    '   > 10連ガチャを引く',
    '     回数を指定するとその回数回します',
    '     limitを指定するとガチャの上限まで引きます',
    ' * .celovs',
    '   > チンチロリンで遊ぶ',
    '     みかんちゃんとチンチロリンで遊べます',
    '     3回まで投げて出た目で勝負します',
    ' * .gpt [text] / /gpt [text]',
    '   > おしゃべり(ChatGPT)',
    '     みかんちゃんとChatGPTを使ったおしゃべりができます',
    ' * .g4 [text] / /g4 [text]',
    '   > おしゃべり(GPT-4)',
    '     みかんちゃんとChatGPTを使ったおしゃべりができます',
    '     (GPT-4なのでレスポンスは非常に遅いです)',
    '===== お部屋管理系 =====',
    ' * .team [チーム数] [?move]',
    '   > チーム分けを行います',
    '    moveを指定するとチーム分け後にメンバーを移動します',
    ' * .room [名前]',
    '   > お部屋の名前を変更します',
    '===== れもんちゃん系 =====',
    ' * .speak',
    '   > 読み上げを開始します',
    ' * .speaker-config [ボイス番号] [速度]',
    '   > 読み上げのユーザー設定を変更します',
    '    読み上げ番号は`http://rim-linq.net:4044/speakers`で確認できます',
    '    速度は(0.1 - 5.0 | 整数可)で指定できます',
    ' * .discon',
    '   > 読み上げを終了します',
    '===== 音楽再生系 =====',
    ' * .play [URL] / .pl [URL]',
    '   > Youtube の音楽を再生します. プレイリストも可能',
    ' * .search [検索ワード] / .sc [検索ワード]',
    '   > Youtube から検索して音楽を追加/再生します',
    ' * .interrupt [URL] | .pi [URL]',
    '   > 曲を1番目に割り込んで予約する',
    ' * .interrupt [予約番号] | .pi [予約番号]',
    '   > 予約番号の曲を1番目に割り込んで予約する',
    ' * .stop | .st',
    '   > 現在再生中の音楽を止める(次がある場合は次を再生する)',
    ' * .shuffle | .sf',
    '   > 現在のキューの音楽をシャッフルする',
    ' * .rem [予約番号] | .rm [予約番号]',
    '   > 予約している曲を削除する',
    ' * .rem all | .rm all',
    '   > 予約している曲を全て削除し、音楽再生を中止する',
    ' * .silent | .si',
    '   > 音楽再生の通知を切り替えます',
    '   > offの場合は次の曲に変わっても通知しなくなりますが, 自動シャッフル時にのみ通知されます',
    '===== プレイリスト系 =====',
    ' * .list',
    '   > 登録されているプレイリストの一覧を表示します',
    ' * .list add [名前] [URL]',
    '   > プレイリストを登録します',
    ' * .list rem [名前] | .list rm [名前]',
    '   > プレイリストを削除します',
    ' * .list loop [名前] [on | off] | .list lp [名前] [on | off]',
    '   > 対象プレイリストのループ処理を書き換えます',
    ' * .list shuffle [名前] [on | off] | .list sf [名前] [on | off]',
    '   > 対象プレイリストの自動シャッフル処理を書き換えます',
    '```'
].join('\n');

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
