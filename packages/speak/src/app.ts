import 'dayjs/locale/ja.js';
import { getVoiceConnections } from '@discordjs/voice';
import {
  ChannelType,
  Guild,
  Message,
  OAuth2Guild,
  REST,
  Routes,
  SlashCommandBuilder,
  VoiceBasedChannel,
} from 'discord.js';
import express from 'express';
import { fs } from 'mz';
import {
  LogLevel,
  SpeakerRepository,
  createDataSource,
  findMissingConfig,
  logError,
  registerGracefulShutdown,
  registerUnhandledRejectionLogger,
  withErrorLog,
} from '@orangebot/shared';
import { commandSelector, interactionSelector } from './bot/commands.js';
import * as DotBotFunctions from './bot/dot_function/index.js';
import { joinVoiceChannel, leftVoiceChannel } from './bot/dot_function/room.js';
import { LiteLLMMode } from './bot/service/chatService.js';
import * as SpeakService from './bot/service/speakService.js';
import { initializeCoeiroSpeakerIds } from './common/common.js';
import { Logger } from './common/logger.js';
import { CONFIG, CommandConfig } from './config/config.js';
import { DISCORD_CLIENT } from './constant/constants.js';
import { initJob } from './job/job.js';
import { routers } from './routers.js';

// read config file
const json = process.argv[2];
if (!json) {
  console.error('config file not found');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(json, 'utf8')) as CommandConfig;

if (!data.COMMAND.SPEAK) {
  console.error('config file not found');
  process.exit(1);
}

CONFIG.TOKEN = data.TOKEN;
CONFIG.APP_ID = data.APP_ID;
CONFIG.NAME = data.NAME;
CONFIG.COMMAND = data.COMMAND;
CONFIG.PORT = data.PORT;

// 必須の設定値が無ければ起動しない
const missingConfig = findMissingConfig({
  TOKEN: CONFIG.TOKEN,
  APP_ID: CONFIG.APP_ID,
  PORT: CONFIG.PORT,
  'DB.HOSTNAME': CONFIG.DB.HOSTNAME,
  'DB.PORT': CONFIG.DB.PORT,
  'DB.USERNAME': CONFIG.DB.USERNAME,
  'DB.DATABASE': CONFIG.DB.DATABASE,
});
if (missingConfig.length > 0) {
  console.error(
    `必須の設定値が未設定です: ${missingConfig.join(', ')} (${json} と src/config/config.ts を確認してください)`
  );
  process.exit(1);
}

registerUnhandledRejectionLogger();

const app = express();
app.use(express.json());

app.use('/', routers);

const server = app.listen(CONFIG.PORT, () => {
  console.log(`Server is running on port ${CONFIG.PORT}`);
});

console.log('==================================================');

// 読み上げbotは複数プロセスが同一DBを共有するためスキーマ同期は行わない
const dataSource = createDataSource({
  host: CONFIG.DB.HOSTNAME,
  username: CONFIG.DB.USERNAME,
  password: CONFIG.DB.PASSWORD,
  port: CONFIG.DB.PORT,
  database: CONFIG.DB.DATABASE,
  synchronize: false,
});
await dataSource
  .initialize()
  .then(async () => {
    await Logger.put({
      guild_id: undefined,
      channel_id: undefined,
      user_id: undefined,
      level: LogLevel.SYSTEM,
      event: 'db-init',
      message: ['success'],
    });
  })
  .catch(async (e) => {
    await Logger.put({
      guild_id: undefined,
      channel_id: undefined,
      user_id: undefined,
      level: LogLevel.SYSTEM,
      event: 'db-init',
      message: [e.message],
    });
    // DB が使えない状態では動作できないため終了する (DB へのログ出力も失敗するため標準エラーにも出す)
    console.error('DB の初期化に失敗しました:', e);
    process.exit(1);
  });

/**
 * =======================
 * Bot Process
 * =======================
 */

// ギルドコマンドは現在登録を止めている (登録処理は body: [] を送る)。再開時に使うため定義は残す
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const serverCommands = [
  new SlashCommandBuilder().setName(CONFIG.COMMAND.SPEAK.COMMAND_NAME).setDescription('読み上げを呼び出す'),
].map((command) => command.toJSON());

const dmCommands = [
  new SlashCommandBuilder()
    .setName('delete')
    .setDescription('ChatGPTとのチャット履歴を削除します')
    .addBooleanOption((option) => option.setName('last').setDescription('直前のみ削除します').setRequired(false)),
  new SlashCommandBuilder()
    .setName('revert')
    .setDescription('最新のチャット履歴を復元します（uuidは/historyから取得できます）')
    .addStringOption((option) =>
      option.setName('uuid').setDescription('会話ID（/historyから取得できます）').setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName(CONFIG.COMMAND.SPEAKER_CONFIG.COMMAND_NAME_SHORT)
    .setDescription('スピーカーの設定を行う')
    .addNumberOption((option) => option.setName('voice_id').setDescription('使用する声のID').setRequired(true))
    .addNumberOption((option) => option.setName('speed').setDescription('話す速度 1が標準 (0.5 - 2.0)'))
    .addNumberOption((option) =>
      option.setName('pitch').setDescription('声のピッチ 高さ変更, 0が標準 (-0.1 - 0.1くらい目安)')
    )
    .addNumberOption((option) =>
      option.setName('intonation').setDescription('声の抑揚 下げるほど棒読み 1が標準 (0.0 - 1.0)')
    ),
  new SlashCommandBuilder().setName('model-list').setDescription('モデル一覧を表示します'),
  new SlashCommandBuilder()
    .setName('model-set')
    .setDescription('モデルを設定します')
    .addStringOption((option) => option.setName('model').setDescription('使用するモデル').setRequired(true)),
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);
// ログインできなければ Bot として動作できないため終了する
DISCORD_CLIENT.login(CONFIG.TOKEN).catch(async (e) => {
  await logError('discord-login', e);
  process.exit(1);
});

/**
 * bot初回読み込み
 */
DISCORD_CLIENT.once(
  'ready',
  withErrorLog('ready', async () => {
    await initJob();
    await initializeCoeiroSpeakerIds();

    // 1 ギルドの失敗で他のギルドの処理が止まらないよう、ギルドごとに例外をログに残す
    const guilds = await DISCORD_CLIENT.guilds.fetch();
    await Promise.all(
      guilds.map(
        withErrorLog('reg-command', async (guild: OAuth2Guild) => {
          await rest
            .put(Routes.applicationGuildCommands(CONFIG.APP_ID, guild.id), { body: [] /**serverCommands */ })
            .then(
              async () =>
                await Logger.put({
                  guild_id: guild.id,
                  channel_id: undefined,
                  user_id: undefined,
                  level: LogLevel.SYSTEM,
                  event: 'reg-command|add',
                  message: [`successfully add command to guild: ${guild.name}.`],
                })
            )
            .catch(console.error);
        })
      )
    );

    // スラッシュコマンドの登録
    await rest
      .put(Routes.applicationCommands(CONFIG.APP_ID), { body: dmCommands })
      .then(async () => {
        await Logger.put({
          guild_id: undefined,
          channel_id: undefined,
          user_id: undefined,
          level: LogLevel.SYSTEM,
          event: 'reg-command|add',
          message: ['successfully add command to DM.'],
        });
      })
      .catch(console.error);

    // 在籍ユーザーごとに DM チャンネルを作成し、ユーザからのDMを受け取れるようにする
    await Promise.all(
      DISCORD_CLIENT.guilds.cache.map(
        withErrorLog('guild-members-sync', async (guild: Guild) => {
          const members = await guild.members.fetch();
          await Promise.all(
            members.map(async (member) => {
              if (member.user.bot) {
                return;
              }
              await member.user.createDM();
            })
          );
        })
      )
    );

    await Logger.put({
      guild_id: undefined,
      channel_id: undefined,
      user_id: undefined,
      level: LogLevel.SYSTEM,
      event: 'ready',
      message: [`discord bot logged in: ${DISCORD_CLIENT.user?.displayName}`],
    });

    const repository = new SpeakerRepository();
    await Promise.all(
      guilds.map(
        withErrorLog('speaker-register', async (guild: OAuth2Guild) => {
          await repository.registerSpeaker(guild.id, DISCORD_CLIENT.user!.id);
        })
      )
    );
    setInterval(() => {
      SpeakService.speak();
    }, 100);
  })
);

/**
 * メッセージの受信イベント
 */
DISCORD_CLIENT.on(
  'messageCreate',
  withErrorLog('message-create', async (message: Message) => {
    // 発言者がbotの場合は落とす
    if (message.author.bot) {
      return;
    }

    // command
    if (message.content.startsWith('.')) {
      await Logger.put({
        guild_id: message.guild?.id,
        channel_id: message.channel.id,
        user_id: message.author.id,
        level: LogLevel.SYSTEM,
        event: 'command-received',
        message: [
          `gid: ${message.guild?.id}, gname: ${message.guild?.name}`,
          `cid: ${message.channel.id}, cname: ${message.channel.type !== ChannelType.DM ? message.channel.name : 'DM'}`,
          `author : ${message.author.displayName}`,
          `content: ${message.content}`,
        ],
      });
      await commandSelector(message);
      return;
    }

    if (
      message.content.includes(`<@${DISCORD_CLIENT.user?.id}>`) &&
      message.content.trimEnd() !== `<@${DISCORD_CLIENT.user?.id}>`
    ) {
      await DotBotFunctions.Chat.talk(message, message.content, CONFIG.LITELLM.DEFAULT_MODEL, LiteLLMMode.DEFAULT);
      return;
    }

    if (message.channel.type === ChannelType.DM) {
      await DotBotFunctions.Chat.talk(message, message.content, CONFIG.LITELLM.DEFAULT_MODEL, LiteLLMMode.DEFAULT);
      return;
    }

    const state = SpeakService.Speaker.player.find((s) => s.guild_id === message.guild?.id);
    if (!state) {
      if (message.mentions.users.find((x) => x.id === DISCORD_CLIENT.user?.id)) {
        await DotBotFunctions.Speak.CallSpeaker(message, true);
      }
      return;
    }
    if (!state.channel.player) {
      return;
    }

    if (message.channel.type === ChannelType.GuildVoice) {
      if (message.mentions.users.size === 0 && message.mentions.roles.size === 0) {
        await Logger.put({
          guild_id: message.guild?.id,
          channel_id: message.channel.id,
          user_id: message.author.id,
          level: LogLevel.SYSTEM,
          event: 'message-received',
          message: [`author: ${message.author.tag}, content: ${message.content}`],
        });
        await SpeakService.addQueue(message.channel as VoiceBasedChannel, message.content, message.author.id);
      }
    }
  })
);

/**
 * コマンドの受信イベント
 */
DISCORD_CLIENT.on(
  'interactionCreate',
  withErrorLog('interaction-create', async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }
    await Logger.put({
      guild_id: interaction.guild ? interaction.guild.id : undefined,
      channel_id: interaction.channel?.id,
      user_id: interaction.user.id,
      level: LogLevel.INFO,
      event: 'interaction-received',
      message: [
        `cid: ${interaction.channel?.id}`,
        `author: ${interaction.user.displayName}`,
        `content: ${interaction}`,
      ],
    });
    await interactionSelector(interaction);
  })
);

DISCORD_CLIENT.on(
  'voiceStateUpdate',
  withErrorLog('voice-state-update', async (oldState, newState) => {
    if (oldState.channelId === newState.channelId) {
      return;
    }

    if (newState.channelId === null) {
      await leftVoiceChannel(oldState);
    } else if (oldState.channelId === null) {
      await joinVoiceChannel(newState);
    } else {
      await leftVoiceChannel(oldState, newState);
      await joinVoiceChannel(newState);
    }
  })
);

/**
 * Discord クライアントのエラー (リスナーが無いとプロセスが落ちる)
 */
DISCORD_CLIENT.on('error', (e) => logError('discord-client-error', e));

/**
 * 終了処理 (SIGTERM / SIGINT)
 */
registerGracefulShutdown([
  { name: 'http-server', run: () => new Promise<void>((resolve) => server.close(() => resolve())) },
  { name: 'voice-connections', run: () => getVoiceConnections().forEach((connection) => connection.destroy()) },
  { name: 'discord-client', run: () => DISCORD_CLIENT.destroy() },
  { name: 'data-source', run: () => dataSource.destroy() },
]);
