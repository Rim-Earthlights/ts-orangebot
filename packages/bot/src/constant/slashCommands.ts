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
        .setName('name')
        .setDescription('お部屋名を変更します')
        .addStringOption((option) =>
          option.setName('name').setDescription('お部屋名 (省略時は お部屋: #nnn)').setRequired(false)
        )
    )
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
      sc.setName('live').setDescription('お部屋を配信中にします (YoutubeやTwitchなどの配信中はつけてください)')
    )
    .addSubcommand((sc) =>
      sc
        .setName('limit')
        .setDescription('お部屋の人数制限を変更します')
        .addNumberOption((option) => option.setName('limit').setDescription('人数').setRequired(true))
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
    .setName('rn')
    .setDescription('お部屋名を変更します (/room nameの短縮形)')
    .addStringOption((option) =>
      option.setName('name').setDescription('お部屋名 (省略時は お部屋: #nnn)').setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('dc')
    .setDescription('特定のユーザーをボイスチャンネルから切断します')
    .addUserOption((option) => option.setName('user').setDescription('ユーザー').setRequired(true)),
  new SlashCommandBuilder()
    .setName('rip')
    .setDescription('特定のユーザーを墓(AFK)チャンネルへ移動します')
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
  new SlashCommandBuilder()
    .setName('accept')
    .setDescription('ルールに同意します')
    .addUserOption((option) => option.setName('user').setDescription('ユーザー').setRequired(true)),
  new SlashCommandBuilder()
    .setName('nickname')
    .setDescription('あなたの呼び方を登録します')
    .addStringOption((option) =>
      option.setName('name').setDescription('呼び方 (空で登録すると表示名に戻ります)').setRequired(false)
    ),
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
  new SlashCommandBuilder().setName('discon').setDescription('読み上げボットを切断します'),
  new SlashCommandBuilder()
    .setName('dict')
    .setDescription('読み上げの辞書を設定します')
    .addSubcommand((sc) =>
      sc
        .setName('add')
        .setDescription('辞書に単語を登録します')
        .addStringOption((option) => option.setName('surface').setDescription('単語').setRequired(true))
        .addStringOption((option) => option.setName('pronunciation').setDescription('読み(カタカナ)').setRequired(true))
        .addNumberOption((option) =>
          option.setName('accent_type').setDescription('アクセント型(音が下がる場所. 0で平板)').setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('word_type')
            .setDescription('品詞')
            .setRequired(false)
            .addChoices(
              { name: '固有名詞', value: 'PROPER_NOUN' },
              { name: '普通名詞', value: 'COMMON_NOUN' },
              { name: '動詞', value: 'VERB' },
              { name: '形容詞', value: 'ADJECTIVE' },
              { name: '語尾', value: 'SUFFIX' }
            )
        )
        .addNumberOption((option) =>
          option
            .setName('priority')
            .setDescription('優先度(0-10. 大きいほど優先. 推奨1-9)')
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(10)
        )
    )
    .addSubcommand((sc) => sc.setName('list').setDescription('辞書に登録されている単語の一覧を表示します'))
    .addSubcommand((sc) =>
      sc
        .setName('remove')
        .setDescription('辞書から単語を削除します')
        .addStringOption((option) => option.setName('uuid').setDescription('単語のUUID').setRequired(true))
    ),
  new SlashCommandBuilder()
    .setName('user-type')
    .setDescription('ユーザーの権限を変更します')
    .addStringOption((option) => option.setName('user_id').setDescription('ユーザーID').setRequired(true))
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('権限タイプ')
        .setRequired(true)
        .addChoices(
          { name: 'OWNER', value: 'OWNER' },
          { name: 'ADMIN', value: 'ADMIN' },
          { name: 'MEMBER', value: 'MEMBER' },
          { name: 'GUEST', value: 'GUEST' }
        )
    ),
  new SlashCommandBuilder()
    .setName('term')
    .setDescription('サーバー上でコマンドを実行します (OWNERのみ)')
    .addStringOption((option) =>
      option.setName('command').setDescription('実行するコマンド (例: podman start server)').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('rust')
    .setDescription('Rustサーバー関連機能 (利用規約同意済みユーザー)')
    .addSubcommandGroup((group) =>
      group
        .setName('whitelist')
        .setDescription('Rust whitelist関連機能')
        .addSubcommand((sc) =>
          sc
            .setName('add')
            .setDescription('Steamユーザーへwhitelist.allowを付与します')
            .addStringOption((option) =>
              option
                .setName('url_or_id')
                .setDescription('SteamID または https://steamcommunity.com/profiles/<SteamID>/')
                .setRequired(true)
            )
        )
        .addSubcommand((sc) =>
          sc
            .setName('revoke')
            .setDescription('Steamユーザーからwhitelist.allowを剥奪します')
            .addStringOption((option) =>
              option
                .setName('url_or_id')
                .setDescription('SteamID または https://steamcommunity.com/profiles/<SteamID>/')
                .setRequired(true)
            )
        )
    ),
  new SlashCommandBuilder().setName('pause').setDescription('チャットを一時停止します (10分後に自動で再開します)'),
  new SlashCommandBuilder().setName('resume').setDescription('チャットを再開します'),
  // 音楽再生機能
  new SlashCommandBuilder()
    .setName('music')
    .setDescription('音楽の再生関連機能です')
    .addSubcommand((sc) =>
      sc
        .setName('play')
        .setDescription('音楽を再生します (登録済みプレイリスト名も指定できます)')
        .addStringOption((option) =>
          option.setName('url').setDescription('YoutubeのURL or プレイリスト名').setRequired(true)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('search')
        .setDescription('単語で検索して再生します')
        .addStringOption((option) => option.setName('word').setDescription('検索する単語').setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName('interrupt')
        .setDescription('割込予約します (URL or キュー番号)')
        .addStringOption((option) =>
          option.setName('target').setDescription('YoutubeのURL or キュー番号').setRequired(true)
        )
    )
    .addSubcommand((sc) => sc.setName('stop').setDescription('再生を停止します'))
    .addSubcommand((sc) =>
      sc
        .setName('remove')
        .setDescription('キューから曲を削除します (番号を省略すると全曲削除)')
        .addIntegerOption((option) => option.setName('num').setDescription('キュー番号').setRequired(false))
    )
    .addSubcommand((sc) => sc.setName('pause').setDescription('再生を一時停止/再開します'))
    .addSubcommand((sc) => sc.setName('queue').setDescription('現在の予約状況を表示します'))
    .addSubcommand((sc) => sc.setName('shuffle').setDescription('キューをシャッフルします'))
    .addSubcommand((sc) => sc.setName('silent').setDescription('サイレントモードを切り替えます'))
    .addSubcommand((sc) =>
      sc
        .setName('mode')
        .setDescription('再生設定を表示/変更します (未指定で表示)')
        .addStringOption((option) =>
          option
            .setName('name')
            .setDescription('変更する設定')
            .setRequired(false)
            .addChoices({ name: 'シャッフル', value: 'sf' }, { name: 'ループ', value: 'lp' })
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('seek')
        .setDescription('再生位置を移動します')
        .addStringOption((option) => option.setName('time').setDescription('秒数 or mm:ss 形式').setRequired(true))
    ),
  // プレイリスト管理機能
  new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('プレイリストの管理機能です')
    .addSubcommand((sc) => sc.setName('list').setDescription('登録済みプレイリストの一覧を表示します'))
    .addSubcommand((sc) =>
      sc
        .setName('add')
        .setDescription('プレイリストを登録します')
        .addStringOption((option) => option.setName('name').setDescription('登録名').setRequired(true))
        .addStringOption((option) =>
          option.setName('url').setDescription('プレイリスト or 動画のURL').setRequired(true)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('remove')
        .setDescription('プレイリストを削除します')
        .addStringOption((option) => option.setName('name').setDescription('登録名').setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName('loop')
        .setDescription('プレイリストのループ設定を変更します')
        .addStringOption((option) => option.setName('name').setDescription('登録名').setRequired(true))
        .addBooleanOption((option) => option.setName('enabled').setDescription('ループON/OFF').setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName('shuffle')
        .setDescription('プレイリストのシャッフル設定を変更します')
        .addStringOption((option) => option.setName('name').setDescription('登録名').setRequired(true))
        .addBooleanOption((option) => option.setName('enabled').setDescription('シャッフルON/OFF').setRequired(true))
    ),
  // new SlashCommandBuilder().setName('tenki').setDescription('天気予報を表示します'),
  // new SlashCommandBuilder().setName('luck').setDescription('今日の運勢を表示します'),
  // new SlashCommandBuilder().setName('info').setDescription('ユーザ情報を表示します'),
];

export const DM_SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('delete')
    .setDescription('みかんちゃんとのチャット履歴を削除します')
    .addBooleanOption((option) => option.setName('last').setDescription('直前のみ削除します').setRequired(false)),
  new SlashCommandBuilder()
    .setName('revert')
    .setDescription('最新のチャット履歴を復元します（uuidは/historyから取得できます）')
    .addStringOption((option) =>
      option.setName('uuid').setDescription('会話ID（/historyから取得できます）').setRequired(false)
    ),
  new SlashCommandBuilder().setName('history').setDescription('このチャンネルのチャット履歴を表示します'),
  new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('曲名を指定して歌詞を表示します(指定しない場合はSpotifyで聴いている曲の歌詞を表示します)')
    .addStringOption((option) => option.setName('query').setDescription('曲名').setRequired(false)),
  new SlashCommandBuilder()
    .setName('model')
    .setDescription('モデルを変更します')
    .addStringOption((option) =>
      option
        .setName('model')
        .setDescription('モデル')
        .setRequired(true)
        .addChoices(
          { name: 'default', value: 'default' },
          { name: 'low', value: 'low' },
          { name: 'high', value: 'high' }
        )
    ),
  new SlashCommandBuilder().setName('cat').setDescription('めあの写真を表示します'),
];
