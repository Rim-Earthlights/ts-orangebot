import { DM_SLASH_COMMANDS, SERVER_SLASH_COMMANDS } from '../../../constant/slashCommands.js';
import { Tool } from './types.js';

type CommandScope = 'dot' | 'server_slash' | 'dm_slash';

type CommandEntry = {
  scope: CommandScope;
  category: string;
  command: string;
  description: string;
  aliases?: string[];
  permission?: string;
  source?: string;
};

type SlashOptionJson = {
  type?: number;
  name: string;
  description?: string;
  required?: boolean;
  options?: SlashOptionJson[];
};

type SlashCommandJson = {
  name: string;
  description?: string;
  options?: SlashOptionJson[];
};

const SUB_COMMAND_TYPE = 1;
const SUB_COMMAND_GROUP_TYPE = 2;

const dotCommands: CommandEntry[] = [
  {
    scope: 'dot',
    category: 'ヘルプ・情報',
    command: '.help',
    description: 'ヘルプを表示します',
  },
  {
    scope: 'dot',
    category: 'ユーザー登録',
    command: '.reg pref <都道府県>',
    description: '都道府県を登録します',
  },
  {
    scope: 'dot',
    category: 'ユーザー登録',
    command: '.reg name <名前>',
    description: '名前を登録し、可能ならニックネームも変更します',
  },
  {
    scope: 'dot',
    category: 'ユーザー登録',
    command: '.reg birth <MMDD>',
    description: '誕生日を登録します',
  },
  {
    scope: 'dot',
    category: 'ゲーム・ダイス',
    command: '.dice [num] [max]',
    description: 'ダイスを振ります',
  },
  {
    scope: 'dot',
    category: 'ゲーム・ダイス',
    command: '.dall',
    description: 'ボイスチャットにいる人全員で100面ダイスを振ります',
  },
  {
    scope: 'dot',
    category: 'ゲーム・ダイス',
    command: '.celo',
    description: 'チンチロリンダイスゲームをします',
  },
  {
    scope: 'dot',
    category: 'ゲーム・ダイス',
    command: '.celovs',
    description: 'みかんちゃんとチンチロリン対戦をします',
  },
  {
    scope: 'dot',
    category: 'ゲーム・ダイス',
    command: '.choose <選択肢1> <選択肢2> ...',
    aliases: ['.choice', '.ch'],
    description: '選択肢からランダムに1つ選びます',
  },
  {
    scope: 'dot',
    category: 'ガチャ',
    command: '.gacha [num|limit]',
    aliases: ['.g'],
    description: 'ガチャを引きます。limit指定で上限まで引きます',
  },
  {
    scope: 'dot',
    category: 'ガチャ',
    command: '.gp',
    description: 'ガチャ排出率を表示します',
  },
  {
    scope: 'dot',
    category: 'ガチャ',
    command: '.gl',
    description: '手持ちチケットを上限まで使ってガチャを引きます',
  },
  {
    scope: 'dot',
    category: 'ガチャ',
    command: '.give <user> <amount>',
    description: 'ガチャチケットを付与します',
    permission: '管理者向け',
  },
  {
    scope: 'dot',
    category: 'AIチャット',
    command: '.gpt <text>',
    aliases: ['.mikan'],
    description: 'みかんちゃんと会話します',
  },
  {
    scope: 'dot',
    category: 'AIチャット',
    command: '.raw <text>',
    description: 'AIのレスポンスをプロンプトなしでそのまま表示します',
  },
  {
    scope: 'dot',
    category: 'AIチャット',
    command: '.memory',
    description: 'メモリ機能を切り替えます',
  },
  {
    scope: 'dot',
    category: 'AIチャット',
    command: '.model [default|low|high] [model]',
    aliases: ['.model-info'],
    description: 'AIモデル設定の表示または変更をします',
  },
  {
    scope: 'dot',
    category: 'AIチャット',
    command: '.speech <text>',
    description: 'テキストから音声を生成します',
  },
  {
    scope: 'dot',
    category: 'AIチャット',
    command: '.pic <prompt>',
    description: 'プロンプトから画像を生成します',
  },
  {
    scope: 'dot',
    category: '音楽再生',
    command: '.play <url|playlist>',
    aliases: ['.pl'],
    description: 'YouTube URLまたはプレイリストを再生します',
  },
  {
    scope: 'dot',
    category: '音楽再生',
    command: '.search <query>',
    aliases: ['.sc'],
    description: 'YouTubeで検索して再生します',
  },
  {
    scope: 'dot',
    category: '音楽再生',
    command: '.interrupt <url|num>',
    aliases: ['.pi'],
    description: '曲を優先キューに追加します',
  },
  {
    scope: 'dot',
    category: '音楽再生',
    command: '.stop',
    aliases: ['.st'],
    description: '再生を停止します',
  },
  {
    scope: 'dot',
    category: '音楽再生',
    command: '.rem <num|all>',
    aliases: ['.rm'],
    description: 'キューから曲を削除します。all指定で全削除します',
  },
  {
    scope: 'dot',
    category: '音楽再生',
    command: '.pause',
    description: '再生を一時停止または再開します',
  },
  {
    scope: 'dot',
    category: '音楽再生',
    command: '.q',
    description: 'キューを表示します',
  },
  {
    scope: 'dot',
    category: '音楽再生',
    command: '.silent',
    aliases: ['.si'],
    description: '再生通知を切り替えます',
  },
  {
    scope: 'dot',
    category: '音楽再生',
    command: '.mode [lp|sf]',
    description: 'ループ/シャッフルモードを表示または切り替えます',
  },
  {
    scope: 'dot',
    category: '音楽再生',
    command: '.shuffle',
    aliases: ['.sf'],
    description: 'キューをシャッフルします',
  },
  {
    scope: 'dot',
    category: '音楽再生',
    command: '.seek <time>',
    description: '現在の曲の再生位置を変更します',
  },
  {
    scope: 'dot',
    category: 'プレイリスト',
    command: '.list',
    description: '登録されているプレイリスト一覧を表示します',
  },
  {
    scope: 'dot',
    category: 'プレイリスト',
    command: '.list add <name> <url>',
    description: 'プレイリストを登録します',
  },
  {
    scope: 'dot',
    category: 'プレイリスト',
    command: '.list rem <name>',
    aliases: ['.list rm <name>'],
    description: 'プレイリストを削除します',
  },
  {
    scope: 'dot',
    category: 'プレイリスト',
    command: '.list loop <name> [on|off]',
    aliases: ['.list lp <name> [on|off]'],
    description: 'プレイリストのループ設定を切り替えます',
  },
  {
    scope: 'dot',
    category: 'プレイリスト',
    command: '.list shuffle <name> [on|off]',
    aliases: ['.list sf <name> [on|off]'],
    description: 'プレイリストのシャッフル設定を切り替えます',
  },
  {
    scope: 'dot',
    category: 'ルーム管理',
    command: '.room [name]',
    aliases: ['.rn [name]'],
    description: 'ルーム名を変更します',
  },
  {
    scope: 'dot',
    category: 'ルーム管理',
    command: '.room live [name]',
    description: '配信モードに設定します',
  },
  {
    scope: 'dot',
    category: 'ルーム管理',
    command: '.room delete',
    aliases: ['.room lock'],
    description: 'ルーム自動削除設定を切り替えます',
  },
  {
    scope: 'dot',
    category: 'ルーム管理',
    command: '.team [num] [?move]',
    description: 'ボイスメンバーをチーム分けします',
  },
  {
    scope: 'dot',
    category: 'ルーム管理',
    command: '.custom [start|end]',
    description: 'カスタムルーム作成/削除をします',
  },
  {
    scope: 'dot',
    category: 'ルーム管理',
    command: '.popup-rule',
    description: 'ルールポップアップを表示します',
  },
  {
    scope: 'dot',
    category: 'ルーム管理',
    command: '.relief',
    description: 'リリーフコマンドを実行します',
  },
  {
    scope: 'dot',
    category: '読み上げ',
    command: '.speak',
    description: '読み上げBotを呼び出します',
  },
  {
    scope: 'dot',
    category: '読み上げ',
    command: '.discon',
    description: '読み上げを停止して切断します',
    source: 'speak_bot',
  },
  {
    scope: 'dot',
    category: '読み上げ',
    command: '.speaker-config <voice_id> [speed] [pitch] [intonation]',
    aliases: ['.spcon <voice_id> [speed] [pitch] [intonation]'],
    description: '読み上げの声・速度・ピッチ・抑揚を設定します',
    source: 'speak_bot',
  },
  {
    scope: 'dot',
    category: '読み上げ',
    command: '.sp-reload',
    description: 'スピーカーID一覧を再読込します',
    source: 'speak_bot',
  },
  {
    scope: 'dot',
    category: '読み上げ',
    command: '.<bot名> <text>',
    description: '読み上げBotのLLMとチャットします',
    source: 'speak_bot',
  },
  {
    scope: 'dot',
    category: '天気予報',
    command: '.tenki <地域> [?日数]',
    description: '天気予報を取得します',
  },
  {
    scope: 'dot',
    category: 'その他',
    command: '.luck',
    description: '今日の運勢を表示します',
  },
  {
    scope: 'dot',
    category: 'その他',
    command: '.cat',
    description: '猫の写真を表示します',
  },
  {
    scope: 'dot',
    category: 'その他',
    command: '.topic',
    description: 'ランダムな話題を表示します',
  },
];

function optionUsage(option: SlashOptionJson): string {
  const name = option.name;
  return option.required ? `<${name}>` : `[${name}]`;
}

function slashCommandEntries(commands: typeof SERVER_SLASH_COMMANDS, scope: CommandScope): CommandEntry[];
function slashCommandEntries(commands: typeof DM_SLASH_COMMANDS, scope: CommandScope): CommandEntry[];
function slashCommandEntries(
  commands: typeof SERVER_SLASH_COMMANDS | typeof DM_SLASH_COMMANDS,
  scope: CommandScope
): CommandEntry[] {
  return commands.flatMap((command) => {
    const json = command.toJSON() as SlashCommandJson;
    const category = categoryForSlashCommand(json.name);
    const subCommands = (json.options ?? []).filter(
      (option) => option.type === SUB_COMMAND_TYPE || option.type === SUB_COMMAND_GROUP_TYPE
    );

    if (subCommands.length === 0) {
      const args = (json.options ?? []).map(optionUsage).join(' ');
      return [
        {
          scope,
          category,
          command: `/${json.name}${args ? ` ${args}` : ''}`,
          description: json.description ?? '',
          permission: permissionForSlashCommand(json.name),
          source: 'bot',
        },
      ];
    }

    return subCommands.flatMap((subCommand) => {
      if (subCommand.type === SUB_COMMAND_GROUP_TYPE) {
        return (subCommand.options ?? []).map((nested) => {
          const args = (nested.options ?? []).map(optionUsage).join(' ');
          return {
            scope,
            category,
            command: `/${json.name} ${subCommand.name} ${nested.name}${args ? ` ${args}` : ''}`,
            description: nested.description ?? subCommand.description ?? json.description ?? '',
            permission: permissionForSlashCommand(json.name),
            source: 'bot',
          };
        });
      }

      const args = (subCommand.options ?? []).map(optionUsage).join(' ');
      return [
        {
          scope,
          category,
          command: `/${json.name} ${subCommand.name}${args ? ` ${args}` : ''}`,
          description: subCommand.description ?? json.description ?? '',
          permission: permissionForSlashCommand(json.name),
          source: 'bot',
        },
      ];
    });
  });
}

function categoryForSlashCommand(name: string): string {
  if (['ping', 'help'].includes(name)) return 'ヘルプ・情報';
  if (['gacha', 'gc', 'gl'].includes(name)) return 'ガチャ';
  if (['chat', 'ai', 'memory', 'pause', 'resume', 'delete', 'revert', 'history', 'model'].includes(name)) {
    return 'AIチャット';
  }
  if (['room', 'rn'].includes(name)) return 'ルーム管理';
  if (['dice', 'genito', 'ito'].includes(name)) return 'ゲーム・ダイス';
  if (['speak', 'discon', 'dict', 'nickname'].includes(name)) return '読み上げ';
  if (name === 'music') return '音楽再生';
  if (name === 'playlist') return 'プレイリスト';
  if (name === 'lyrics') return 'メディア';
  if (['rip', 'dc', 'mute', 'timeout', 'user-type', 'term', 'accept'].includes(name)) return '管理';
  return 'その他';
}

function permissionForSlashCommand(name: string): string | undefined {
  if (['rip', 'dc', 'mute', 'timeout'].includes(name)) {
    return '管理者向け';
  }
  if (['user-type', 'term', 'accept'].includes(name)) {
    return 'OWNER向け';
  }
  return undefined;
}

function getAllCommands(): CommandEntry[] {
  return [
    ...dotCommands,
    ...slashCommandEntries(SERVER_SLASH_COMMANDS, 'server_slash'),
    ...slashCommandEntries(DM_SLASH_COMMANDS, 'dm_slash'),
  ];
}

const SEARCH_SYNONYMS: Record<string, string[]> = {
  music: ['音楽', '再生', 'プレイリスト', 'youtube'],
  playlist: ['プレイリスト', 'list'],
  ai: ['ai', 'gpt', 'チャット', '会話', '画像', '音声'],
  chat: ['チャット', '会話', 'gpt', 'mikan'],
  gacha: ['ガチャ'],
  dice: ['ダイス', 'サイコロ', 'ゲーム'],
  room: ['ルーム', '部屋'],
  weather: ['天気', '天気予報', 'tenki'],
  help: ['ヘルプ', 'help'],
  tts: ['読み上げ', 'speak'],
  slash: ['スラッシュ', '/'],
  dot: ['ドット', '.'],
  dm: ['dm', 'direct message', 'ダイレクトメッセージ'],
};

function getStringArg(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalize(value: string): string {
  return value.toLowerCase();
}

function searchTerms(value: string): string[] {
  const normalizedValue = normalize(value);
  const terms = new Set<string>([normalizedValue]);

  for (const [key, values] of Object.entries(SEARCH_SYNONYMS)) {
    if (normalizedValue.includes(key) || values.some((synonym) => normalizedValue.includes(normalize(synonym)))) {
      terms.add(key);
      for (const synonym of values) {
        terms.add(normalize(synonym));
      }
    }
  }

  return [...terms];
}

function valuesIncludeAny(values: Array<string | undefined>, terms: string[]): boolean {
  return values.some((value) => value && terms.some((term) => normalize(value).includes(term)));
}

function matchesCategory(command: CommandEntry, category: string): boolean {
  const terms = /[a-z]/i.test(category) ? searchTerms(category) : [normalize(category)];
  return valuesIncludeAny([command.category], terms);
}

function matchesQuery(command: CommandEntry, query: string): boolean {
  const values = [
    command.command,
    command.description,
    command.category,
    command.permission,
    command.scope,
    command.source,
    ...(command.aliases ?? []),
  ];
  return valuesIncludeAny(values, searchTerms(query));
}

export const botCommandsTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'get_bot_commands',
      description:
        'このDiscord Bot自身が持つコマンド一覧を取得します。ユーザーが「使えるコマンド」「コマンド一覧」「何ができる？」などと聞いたときに使用してください。',
      parameters: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['all', 'dot', 'slash', 'server_slash', 'dm_slash'],
            description:
              '取得対象。all=全て, dot=ドットコマンド, slash=サーバー/DM両方のスラッシュコマンド, server_slash=サーバー用スラッシュコマンド, dm_slash=DM用スラッシュコマンド。',
          },
          category: {
            type: 'string',
            description: 'カテゴリ名で絞り込みます (例: 音楽再生, ガチャ, AIチャット, ルーム管理)。',
          },
          query: {
            type: 'string',
            description: 'コマンド名・説明・別名に対する部分一致検索語。',
          },
        },
        required: [],
      },
    },
  },
  handler: async (args) => {
    const scope = getStringArg(args, 'scope') ?? 'all';
    const category = getStringArg(args, 'category');
    const query = getStringArg(args, 'query');

    let commands = getAllCommands();
    if (scope === 'dot') {
      commands = commands.filter((command) => command.scope === 'dot');
    } else if (scope === 'slash') {
      commands = commands.filter((command) => command.scope === 'server_slash' || command.scope === 'dm_slash');
    } else if (scope === 'server_slash' || scope === 'dm_slash') {
      commands = commands.filter((command) => command.scope === scope);
    }

    if (category) {
      commands = commands.filter((command) => matchesCategory(command, category));
    }

    if (query) {
      commands = commands.filter((command) => matchesQuery(command, query));
    }

    const categories = [...new Set(getAllCommands().map((command) => command.category))];

    return JSON.stringify({
      total: commands.length,
      scope,
      category,
      query,
      categories,
      commands,
      note: 'permissionが付いたコマンドは権限が必要です。source=speak_bot は読み上げBot側のコマンドです。ユーザーには必要なものだけを要約して案内してください。',
    });
  },
};
