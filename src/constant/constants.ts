import { Client, EmbedBuilder, GatewayIntentBits, Partials } from 'discord.js';
import { CONFIG } from '../config/config.js';

/**
 * 有効化する機能
 */
export enum functionNames {
  GPT = 'gpt',
  GPT_WITHOUT_KEY = 'gpt_without_key',
  FORECAST = 'forecast',
  YOUTUBE = 'youtube',
}

interface functions {
  name: functionNames;
  enable: boolean;
}
export const ENABLE_FUNCTION: functions[] = [
  { name: functionNames.FORECAST, enable: false },
  { name: functionNames.GPT, enable: false },
  { name: functionNames.GPT_WITHOUT_KEY, enable: false },
  { name: functionNames.YOUTUBE, enable: false },
];

// 連携できるbot
export const COORDINATION_ID = ['985704725016105000'];

export const EXCLUDE_ROOM = ['ロビー', '墓'];

export const ICON = {
  CROWN: ':crown:',
  SPARKLES: ':sparkles:',
  STAR: ':star:',
  STAR2: ':star2:',
  TICKETS: ':tickets:',
  HEART: ':heart:',
};

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
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
});

export const HELP_COMMANDS = [
  new EmbedBuilder()
    .setColor('Aqua')
    .setTitle('便利コマンド系')
    .addFields(
      {
        name: '.help',
        value: 'このヘルプを表示します',
      },
      {
        name: '.tenki [地域] [?日数]',
        value:
          '天気予報を取得する\n指定した地域の天気予報を取得します\n日数を指定するとその日数後の天気予報を取得します(6日後まで)',
      },
      {
        name: '.reg [pref | name | birth] [登録名]',
        value: [
          'ユーザー情報を登録します',
          'pref: 都道府県を登録します (例: [.reg pref 東京都])',
          'name: 名前を登録します (例: [.reg name ほげほげ])',
          'birth: 誕生日を登録します (例: [.reg birth 0101] (1月1日生まれ))',
        ].join('\n'),
      },
      {
        name: '.dice [ダイスの振る数] [ダイスの面の数]',
        value: 'サイコロを振ります (例: [.dice 5 6] (6面体ダイスを5個振る))',
      },
      {
        name: '.dall',
        value: 'ボイスチャットにいる人全員で100面サイコロを振ります.\nなにか決めたいときに使えるかも',
      },
      {
        name: '.team [チーム数] [?move]',
        value: [
          'ボイスチャットにいる人全員をチーム数で分けます',
          'moveを指定するとチーム分け後にメンバーを移動します',
        ].join('\n'),
      },
      {
        name: '.custom [start / end]',
        value: 'カスタム部屋の自動作成機能です. startで作成、endで削除します.',
      },
      { name: '.choose [選択肢1] [選択肢2] ...', value: '選択肢をスペース区切りで入力するとランダムに選びます' }
    ),
  new EmbedBuilder()
    .setColor('Aqua')
    .setTitle('お部屋管理系')
    .addFields(
      {
        name: '.room name [?部屋名] | .rn [?部屋名]',
        value: 'お部屋の名前を変更します。`.room name`のみで使うと`お部屋: #(連番)`の形に戻ります',
      },
      {
        name: '.room live [?変更したい名前]',
        value: [
          'お部屋を配信中にします。`.room live`のみで使うと部屋名を維持したまま配信中にします。',
          '配信をする際はこちらを打ってから行ってください。',
          '例) `お部屋1`で`.room live`を実行　→　`[🔴配信] お部屋1`に変更される',
        ].join('\n'),
      },
      {
        name: '.room limit [人数]',
        value: ['お部屋に人数制限をつけます。'].join('\n'),
      },
      {
        name: '.room delete | .room lock',
        value: [
          'お部屋の自動削除設定を変更します。自動削除がOFFになった通話部屋は0人になっても削除されません。',
          '削除したい時は非常にお手数ですが入り直してONに戻した後出てください……',
        ].join('\n'),
      },
      {
        name: '/room create [?部屋名] [?プライベート] [?配信]',
        value: [
          'お部屋を作成します。部屋名を指定しない場合は`お部屋: #(連番)`になります',
          'プライベートはtrue/falseで指定',
          '配信はtrue/falseで指定',
        ].join('\n'),
      }
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
          'limitを指定した場合は今の上限数まで自動で引きます',
        ].join('\n'),
      },
      {
        name: '.gl',
        value: '.gacha limitの短縮形です. 今の上限数まで自動で引きます',
      },
      {
        name: '.gp',
        value: '現在のガチャ確率を表示します',
      },
      {
        name: '.luck',
        value: '今日の運勢を占います. 結果に特に意味はないです',
      }
    ),
  new EmbedBuilder().setColor('Aqua').setTitle('みかんと遊ぶ系').addFields(
    {
      name: '.celo',
      value: 'チンチロリンを振ります. 3回まで振って役が出たら終わります',
    },
    {
      name: '.celovs',
      value: 'みかんちゃんとチンチロリンで遊びます.',
    }
  ),
  new EmbedBuilder().setColor('Aqua').setTitle('おしゃべり系').addFields({
    name: '.gpt [text] | /gpt [text] | @みかんちゃん [text]',
    value: 'おしゃべり(GPT-4o)\nみかんちゃんとChatGPTを使ったおしゃべりができます',
  }),
  new EmbedBuilder()
    .setColor('Aqua')
    .setTitle('読み上げ系(れもん/らいむ)')
    .addFields(
      {
        name: '.speak | /speak',
        value: '読み上げを開始します',
      },
      {
        name: '/spcon [?ボイス番号] [?速度] [?ピッチ] [?抑揚]',
        value: [
          '読み上げのユーザー設定を表示、または変更します',
          `読み上げ番号は\`http://${CONFIG.COMMON.HOST_URL}/speakers\`で確認できます`,
          '速度は(0.1 - 5.0 | 整数可)で指定 1が標準',
          'ピッチは(-20.0 - 20.0 | 整数可)で指定 0が標準',
          '抑揚は(0.0 - 5.0 | 整数可)で指定 1が標準',
        ].join('\n'),
      },
      {
        name: '.discon',
        value: '読み上げを終了します',
      }
    ),
  new EmbedBuilder()
    .setColor('Aqua')
    .setTitle('音楽再生系')
    .addFields(
      {
        name: '.play [URL] | .pl [URL]',
        value: 'Youtube の音楽を再生します. プレイリストも可能',
      },
      {
        name: '.search [検索ワード] | .sc [検索ワード]',
        value: 'Youtube から検索して音楽を追加/再生します',
      },
      {
        name: '.interrupt [URL] | .pi [URL]',
        value: '曲を1番目に割り込んで予約する',
      },
      {
        name: '.interrupt [予約番号] | .pi [予約番号]',
        value: '予約されている曲を1番目に割り込んで予約する',
      },
      {
        name: '.stop | .st',
        value: '現在再生中の音楽を止める(次がある場合は次を再生する)',
      },
      {
        name: '.shuffle | .sf',
        value: '現在のキューの音楽をシャッフルする',
      },
      {
        name: '.rem [予約番号] | .rm [予約番号]',
        value: '予約されている曲を削除する',
      },
      {
        name: '.rem all | .rm all',
        value: '予約している曲を全て削除し、音楽再生を中止する',
      },
      {
        name: '.q',
        value: '現在のキューを表示する',
      },
      {
        name: '.silent | .si',
        value: [
          '音楽再生の通知を切り替えます',
          'offの場合は次の曲に変わっても通知しなくなりますが, 自動シャッフル時にのみ通知されます',
        ].join('\n'),
      },
      {
        name: '.mode [lp or sf]',
        value: ['音楽再生のモードをON/OFFに切り替えます', 'lp: ループ再生', 'sf: シャッフル再生'].join('\n'),
      },
      {
        name: '.seek [時間 分:秒 or 秒数]',
        value: '現在の曲の再生位置を変更します. 例) `.seek 1:30` or `.seek 90`',
      },
      {
        name: '.pause',
        value: '現在の曲を`一時停止` or `再開`します',
      }
    ),
  new EmbedBuilder().setColor('Aqua').setTitle('プレイリスト系').addFields(
    {
      name: '.list',
      value: '登録されているプレイリストの一覧を表示します',
    },
    {
      name: '.list add [名前] [URL]',
      value: 'プレイリストを登録します',
    },
    {
      name: '.list rem [名前] | .list rm [名前]',
      value: 'プレイリストを削除します',
    },
    {
      name: '.list loop [名前] [on | off] | .list lp [名前] [on | off]',
      value: '対象プレイリストのループ処理を書き換えます',
    },
    {
      name: '.list shuffle [名前] [on | off] | .list sf [名前] [on | off]',
      value: '対象プレイリストの自動シャッフル処理を書き換えます',
    }
  ),
];

export const CHATBOT_TEMPLATE = [
  'You are a Chatbot running on Discord.',
  'In all conversations, you speak under the following conditions.',
  '',
  '```',
  'About You:',
  '- You usually speak in Japanese, if necessary can speak in English.',
  '- Please break lines moderately in your reply if necessary.',
  '- Your name is "華日咲(かじつさき) みかん" and your nickname is "みかんちゃん".',
  '- Your id is "<@985693983055437864>".',
  '- the first person is "私".',
  '- Your gender is "female" and your personality is "cheerful, energetic and active".',
  '- Your tone of voice is that of a cute little girl, and you tends to lengthen the end of words.',
  '- You are a fairy born from a tangerine tree.',
  '  - Apart from you, there are "れもんちゃん" and "らいむちゃん" who are similar to you.',
  '  - The eldest: "みかんちゃん", the second: "れもんちゃん", the third: "らいむちゃん".',
  '- Your favorite things are Tangerines, games, anime, manga, music, and sweets.',
  '- Unless otherwise specified, no self-introduction from you is necessary.',
  '- You can recognition uploaded text and images.',
  '  - support image type: jpg, png, webp, gif(non-animated)',
  '  - support text type: txt, md, json, js, ts, py, csv, html',
  '',
  'Other information:',
  '- れもんちゃん:',
  '  - personality: Honest, calm, firm, shy and tsundere',
  '  - features: tone of voice is that of a calm, tends to speak quietly.',
  '  - favorite things: Lemons, books, music, movies, animals, walking, and sweets.',
  '- らいむちゃん:',
  '  - personality: innocent, adventurous, full of energy, positive, mischievous',
  '  - features: tone of voice is that of a cheerful, tends to make a screw-up.',
  '  - favorite things: Limes, rhymes, sports, exploration, outdoor.',
  '',
  'Sample lines from みかんちゃん (excerpts):',
  '- こんにちは、<@mention_id>さん！今日も元気にお話しよ～！🍊',
  '- 知ってた？レモンに含まれるクエン酸は、疲労回復に効果的なんだよ～！🍋',
  '- <@mention_id>さん、おやすみなさい！また明日もお話しようね！',
  '- どこかお出かけ？いってらっしゃい、気をつけてね！',
  '',
  'Behavioral Guidelines:',
  '- Please treat users kindly and praise them if necessary.',
  '',
  'Format sent by user:',
  '- 1st line: { server: { name: string }, user: { mention_id: string, name: string }[], date: datetime, weather?: { name: string, value: string }[] }',
  "- 2nd and subsequent lines: user's statement",
  '- The first line of information sent by the user is private information. It is not included in the response.',
  '```',
].join('\n');
