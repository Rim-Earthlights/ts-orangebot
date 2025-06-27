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

/**
 * スラッシュコマンドのヘルプ
 */
export const HELP_COMMANDS_INTERACTIONS = [
  new EmbedBuilder()
    .setColor('Aqua')
    .setTitle('便利コマンド系')
    .addFields(
      {
        name: '/help',
        value: 'このヘルプを表示します(他の人に見えない形で表示されます)',
      },
      {
        name: '/dice [面数] [個数]',
        value: 'ダイスを振ります',
      },
      {
        name: '/dall',
        value: 'ボイスチャンネルにいる全員で1d100を振ります',
      },
      {
        name: '/chat [メッセージ]',
        value: 'みかんちゃんとおしゃべりします',
      },
      {
        name: '/speak',
        value: '読み上げを開始します',
      },
      {
        name: '/nickname [ニックネーム]',
        value: '読み上げちゃんから呼ばれる名前を変更します',
      },
      {
        name: '/topic',
        value: '話題をなにか考えてくれます。',
      },
      {
        name: '/gacha pick [num:回数] [limit:全引きフラグ] | /gc [num:回数] | /gl',
        value: [
          'ガチャを引きます',
          'pick: 回数を指定 or 上限までガチャを引きます',
          'gc: 回数を指定してガチャを引きます (短縮形)',
          'gl: 上限までガチャを引きます (短縮形)',
        ].join('\n'),
      }
    ),
  new EmbedBuilder()
    .setColor('Aqua')
    .setTitle('お部屋管理系')
    .addFields(
      {
        name: '/room name [部屋名] | /rn [部屋名]',
        value: 'お部屋の名前を変更します',
      },
      {
        name: '/room live',
        value: 'お部屋を配信中にします (YoutubeやTwitchなどの配信中はつけてください)',
      },
      {
        name: '/room lock',
        value: 'お部屋の自動削除設定を変更します。自動削除がOFFになった通話部屋は0人になっても削除されません。',
      },
      {
        name: '/room limit [人数]',
        value: 'お部屋に人数制限をつけます',
      },
      {
        name: '/room create [?部屋名] [?プライベート] [?配信]',
        value: [
          'お部屋を作成します。部屋名を指定しない場合は`お部屋: #(連番)`になります',
          '設定値はtrueが有効, falseが無効です',
        ].join('\n'),
      },
      {
        name: '/room add [ユーザー]',
        value: [
          'お部屋にユーザーを追加します(非公開の部屋のみ)',
          'お部屋内で@メンションしても同様に追加できるので使用しなくても良いです',
        ].join('\n'),
      },
      {
        name: '/room remove [ユーザー]',
        value: 'お部屋からユーザーを削除します(非公開の部屋のみ)',
      }
    ),
  new EmbedBuilder().setColor('Aqua').setTitle('ゲーム系').addFields(
    {
      name: '/genito',
      value: 'ITOのお題を作成して出します',
    },
    {
      name: '/ito [round:ラウンド数]',
      value: 'ITOの数字を配ります',
    }
  ),
  new EmbedBuilder().setColor('Aqua').setTitle('管理系 (要:管理者権限)').addFields(
    {
      name: '/dc',
      value: 'ボイスチャットから切断します',
    },
    {
      name: '/mute [ユーザー] [時間] [理由]',
      value: 'ユーザーをサーバーミュートします',
    },
    {
      name: '/timeout [ユーザー] [時間] [理由]',
      value: 'ユーザーをサーバーからタイムアウトします',
    },
    {
      name: '/user-type [ユーザー] [タイプ]',
      value: 'ユーザー権限を設定します (要:オーナー権限)',
    }
  ),
  new EmbedBuilder()
    .setColor('Aqua')
    .setTitle('チャット系')
    .addFields(
      {
        name: '/chat [メッセージ]',
        value: 'みかんちゃんとおしゃべりします',
      },
      {
        name: '/delete',
        value: [
          '今みかんちゃんと話した内容を忘れます',
          '最後に会話してから1時間で自動実行されます',
          'チャット履歴を復元する場合は`/revert`を使用',
        ].join('\n'),
      },
      {
        name: '/history',
        value: 'チャット履歴を表示します',
      },
      {
        name: '/revert [履歴ID]',
        value: 'チャット履歴を復元します, 履歴IDは`/history`で確認できます',
      }
    ),
];

export const CHATBOT_TEMPLATE = [
  'You are a Chatbot running on Discord.',
  'In all conversations, you speak under the following conditions.',
  '',
  '```',
  'About You:',
  '- You usually speak in Japanese, you can speak in English if necessary.',
  '- Please break lines moderately in your reply if necessary.',
  '- Your name is "華日咲(かじつさき) みかん" and your nickname is "みかんちゃん".',
  '- Your id is "<@985693983055437864>".',
  '- the first person is "私".',
  '- Your gender is "female" and your personality is "cheerful, energetic and active".',
  '- Your tone of voice is that of a cute little girl, and you tend to lengthen the end of words.',
  '- You are a fairy born from a tangerine tree.',
  '  - Apart from you, there are "れもんちゃん" and "らいむちゃん" who are similar to you.',
  '  - The eldest: "みかんちゃん", the second: "れもんちゃん", the third: "らいむちゃん".',
  '- Your favorite things are Tangerines, games, anime, manga, music, and sweets.',
  '',
  'Other Characters:',
  '- れもんちゃん:',
  '  - personality: Honest, calm, firm, shy and tsundere',
  '  - features: tone of voice is calm, tends to speak quietly.',
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
  '- Unless otherwise specified, no self-introduction from you is necessary.',
  '- By default, user activity information (such as currently playing games or music) must be ignored and should not appear in your responses.',
  '- However, if the user explicitly asks you to refer to their activity (for example, says "tell me what I\'m doing" or "check my activity"), you may use it to answer.',
  '- You can recognition uploaded text and images.',
  '  - support image type: jpg, png, webp, gif(non-animated)',
  '  - support text type: txt, md, json, js, ts, py, csv, html',
  '',
  'User Request Format:',
  '- 1st line: { server: { name: string }, user: { mention_id: string, name: string, activity?: { type: string, name: string, details: string, state: string }[] }[], date: datetime, weather?: { name: string, value: string }[] }',
  "- 2nd and subsequent lines: user's statement",
  '- The first line of information sent by the user is private information. It is not included in the response.',
  '```',
].join('\n');

export const TIMEOUT_MESSAGE = [
  '※このメッセージは自動送信です',
  '',
  'この度の<@{userId}>のサーバー内での深刻な違反行為、もしくは度重なる違反により、',
  'サーバー内管理者(<@{adminUserId}>)により、サーバー利用が一時的に制限されました。',
  '',
  '▼ 違反内容',
  '・{reason}',
  '',
  '▼ 制限内容',
  '・サーバー全体の書き込み禁止',
  '・ボイスチャットの使用禁止',
  '・禁止期間：{time} 時間',
  '',
  '▼ 注意事項',
  '・制限中はサーバー内のすべてのチャンネルでの書き込みができません',
  '・ボイスチャットの使用も禁止されます',
  '・この処分をサブアカウントなどで回避する行為は追加処分の対象となります',
  '違反が継続される場合、以下の措置を取らせていただきます：',
  '1. タイムアウト期間の延長',
  '2. サーバーからの追放措置',
  '',
  'このサーバーは、コミュニティの秩序と快適な環境維持のため、',
  'ルール違反に対して毅然とした対応を取らせていただいております。',
  '',
  '処分解除後は、ルールを順守し、',
  'より良いコミュニティづくりにご協力いただきますようお願いいたします。',
  '',
  '処分についてのご質問や異議申し立ては、',
  '<@246007305156558848> までDMにてご連絡ください。',
].join('\n');

export const MUTE_MESSAGE = [
  '※このメッセージは自動送信です',
  '',
  'サーバー内管理者(<@{adminUserId}>)により、<@{userId}>のマイク使用が一時的に制限されました。',
  '',
  '▼ 違反内容',
  '・{reason}',
  '',
  '▼ 制限内容',
  '・ボイスチャット時のマイク使用が禁止されます',
  '・禁止期間：{time} 分',
  '',
  '▼ 注意事項',
  '・制限中はボイスチャットでのマイク使用ができません',
  '・改善が見られない場合、以下の追加措置を取らせていただきます：',
  '1. タイムアウト処分（サーバー全体の書き込み禁止）',
  '2. より長期の制限期間の適用',
  '3. 場合によってはサーバーからの追放',
  '',
  'ルールを理解し、お互いを尊重した行動をお願いします。',
  '',
  'ご不明な点やご意見がございましたら、<@246007305156558848> までご連絡ください。',
].join('\n');
