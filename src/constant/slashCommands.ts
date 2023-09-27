import { SlashCommandBuilder } from 'discord.js';

export const SLASH_COMMANDS = [
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
                .addStringOption((option) =>
                    option.setName('item').setDescription('アイテム名 or 等級').setRequired(false)
                )
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
        .setName('gpt')
        .setDescription('GPT-4(8K)でおしゃべりします')
        .addStringOption((option) => option.setName('text').setDescription('text').setRequired(true)),
    new SlashCommandBuilder()
        .setName('g3')
        .setDescription('GPT-3(16K)でおしゃべりします, GPT-3なので軽いです')
        .addStringOption((option) => option.setName('text').setDescription('text').setRequired(true)),
    new SlashCommandBuilder()
        .setName('g4')
        .setDescription('GPT-4(32K)でおしゃべりします. 非常に遅いです')
        .addStringOption((option) => option.setName('text').setDescription('text').setRequired(true)),
    new SlashCommandBuilder()
        .setName('erase')
        .setDescription('ChatGPTとのチャット履歴を削除します')
        .addBooleanOption((option) => option.setName('last').setDescription('直前のみ削除します').setRequired(false)),
    new SlashCommandBuilder()
        .setName('room')
        .setDescription('お部屋の設定をします')
        .addSubcommand((sc) =>
            sc
                .setName('name')
                .setDescription('お部屋名を変更します')
                .addStringOption((option) => option.setName('name').setDescription('お部屋名').setRequired(true))
        )
        .addSubcommand((sc) =>
            sc
                .setName('live')
                .setDescription('配信モードを設定します')
                .addBooleanOption((option) =>
                    option.setName('mode').setDescription('Trueで配信モードON').setRequired(true)
                )
        )
        .addSubcommand((sc) =>
            sc
                .setName('private')
                .setDescription('プライベートモードを設定します')
                .addBooleanOption((option) =>
                    option.setName('mode').setDescription('TrueでプライベートモードON').setRequired(true)
                )
        ),
    new SlashCommandBuilder()
        .setName('dc')
        .setDescription('特定のユーザーをボイスチャンネルから切断します')
        .addUserOption((option) => option.setName('user').setDescription('ユーザー').setRequired(true))
    // new SlashCommandBuilder().setName('tenki').setDescription('天気予報を表示します'),
    // new SlashCommandBuilder().setName('luck').setDescription('今日の運勢を表示します'),
    // new SlashCommandBuilder().setName('info').setDescription('ユーザ情報を表示します'),
    // new SlashCommandBuilder()
    //     .setName('pl')
    //     .setDescription('音楽を再生します')
    //     .addStringOption((option) => option.setName('url').setDescription('youtube url').setRequired(true))
];
