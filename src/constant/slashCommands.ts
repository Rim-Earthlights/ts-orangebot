import { SlashCommandBuilder } from 'discord.js';

export const SERVER_SLASH_COMMANDS = [
  // ping command
  new SlashCommandBuilder().setName('ping').setDescription('replies with pong'),
  new SlashCommandBuilder().setName('help').setDescription('ヘルプを表示します'),
  // gacha command
  new SlashCommandBuilder()
    .setName('gacha')
    .setDescription('ガチャ関連機能')
    .addSubcommand((sc) =>
      sc
        .setName('pick')
        .setDescription('ガチャを引きます. 回数指定しない場合は10回引きます. ')
        .addNumberOption((option) => option.setName('num').setDescription('回数').setRequired(false))
        .addBooleanOption((option) =>
          option
            .setName('limit')
            .setDescription('Trueにするとチケット分も全て引きます。回数指定は無視されます。')
            .setRequired(false)
        )
    )
    .addSubcommand((sc) => sc.setName('list').setDescription('あなたのガチャ景品を表示します'))
    .addSubcommand((sc) =>
      sc
        .setName('extra')
        .setDescription('ガチャを試し引きします. 景品取得判定にはなりません.')
        .addNumberOption((option) => option.setName('num').setDescription('回数').setRequired(false))
        .addStringOption((option) => option.setName('item').setDescription('アイテム名 or 等級').setRequired(false))
    ),
  new SlashCommandBuilder()
    .setName('gc')
    .setDescription('/gachaの短縮形です. 回数指定しない場合は10回引きます.')
    .addNumberOption((option) => option.setName('num').setDescription('回数').setRequired(false))
    .addBooleanOption((option) =>
      option
        .setName('limit')
        .setDescription('Trueにするとチケット分も全て引きます. 回数指定は無視されます.')
        .setRequired(false)
    ),
  new SlashCommandBuilder().setName('gl').setDescription('/gacha limitの短縮形コマンドです.'),
  new SlashCommandBuilder()
    .setName('chat')
    .setDescription('みかんちゃんとおしゃべりします')
    .addStringOption((option) => option.setName('text').setDescription('text').setRequired(true)),
  new SlashCommandBuilder()
    .setName('room')
    .setDescription('お部屋の設定をします')
    .addSubcommand((sc) =>
      sc
        .setName('create')
        .setDescription('お部屋を作ります')
        .addStringOption((option) => option.setName('name').setDescription('お部屋名').setRequired(true))
        .addBooleanOption((option) => option.setName('live').setDescription('Trueで配信モードON').setRequired(false))
        .addBooleanOption((option) =>
          option.setName('private').setDescription('TrueでプライベートモードON').setRequired(false)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('add')
        .setDescription('ユーザーを追加します')
        .addUserOption((option) => option.setName('user').setDescription('ユーザー').setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName('remove')
        .setDescription('ユーザーを削除します')
        .addUserOption((option) => option.setName('user').setDescription('ユーザー').setRequired(true))
    )
    .addSubcommand((sc) => sc.setName('lock').setDescription('お部屋の自動削除を切り替えます')),
  new SlashCommandBuilder()
    .setName('dc')
    .setDescription('特定のユーザーをボイスチャンネルから切断します')
    .addUserOption((option) => option.setName('user').setDescription('ユーザー').setRequired(true)),
  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('特定のユーザーをタイムアウトします')
    .addUserOption((option) => option.setName('user').setDescription('ユーザー').setRequired(true))
    .addNumberOption((option) => option.setName('time').setDescription('タイムアウト時間(h)').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('事由').setRequired(true)),
  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('特定のユーザーをミュートします')
    .addUserOption((option) => option.setName('user').setDescription('ユーザー').setRequired(true))
    .addNumberOption((option) => option.setName('time').setDescription('ミュート時間(m)').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('事由').setRequired(true)),
  new SlashCommandBuilder().setName('topic').setDescription('ランダムなお題を表示します'),
  new SlashCommandBuilder().setName('accept').setDescription('ルールに同意します'),
  new SlashCommandBuilder()
    .setName('nickname')
    .setDescription('あなたの呼び方を登録します')
    .addStringOption((option) => option.setName('name').setDescription('呼び方').setRequired(true)),
  new SlashCommandBuilder()
    .setName('dice')
    .setDescription('サイコロを振ります')
    .addNumberOption((option) => option.setName('num').setDescription('回数'))
    .addNumberOption((option) => option.setName('max').setDescription('最大値')),
  new SlashCommandBuilder().setName('genito').setDescription('itoのお題を出すよ'),
  new SlashCommandBuilder()
    .setName('ito')
    .setDescription('itoのダイスを振ります')
    .addNumberOption((option) => option.setName('round').setDescription('ラウンド数').setRequired(true)),
  new SlashCommandBuilder()
    .setName('ai')
    .setDescription('AIと会話します')
    .addSubcommand((sc) => sc.setName('start').setDescription('会話を開始します'))
    .addSubcommand((sc) => sc.setName('stop').setDescription('会話を停止します')),
  new SlashCommandBuilder().setName('memory').setDescription('メモリ機能を切り替えます'),
  new SlashCommandBuilder().setName('speak').setDescription('読み上げボットを呼び出します'),
  // new SlashCommandBuilder().setName('tenki').setDescription('天気予報を表示します'),
  // new SlashCommandBuilder().setName('luck').setDescription('今日の運勢を表示します'),
  // new SlashCommandBuilder().setName('info').setDescription('ユーザ情報を表示します'),
  // new SlashCommandBuilder()
  //     .setName('pl')
  //     .setDescription('音楽を再生します')
  //     .addStringOption((option) => option.setName('url').setDescription('youtube url').setRequired(true))
];

export const DM_SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('erase')
    .setDescription('みかんちゃんとのチャット履歴を削除します')
    .addBooleanOption((option) => option.setName('last').setDescription('直前のみ削除します').setRequired(false)),
];
