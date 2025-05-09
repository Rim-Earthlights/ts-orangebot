import ytdl from '@distube/ytdl-core';

export enum LiteLLMModel {
  GPT_4_1 = 'openai-gpt-41',
  GPT_4_1_MINI = 'openai-gpt-41-mini',
  GPT_4_1_NANO = 'openai-gpt-41-nano',
  GPT_4O = 'openai-gpt-4o',
  GPT_4O_MINI = 'openai-gpt-4o-mini',
  GPT_45_PREVIEW = 'openai-gpt-45-preview',
  GPT_O1 = 'openai-gpt-o1',
  GPT_O3_MINI = 'openai-gpt-o3-mini',
  ANTHROPIC_CLAUDE_3_5_SONNET = 'anthropic-sonnet-35',
  ANTHROPIC_CLAUDE_3_5_HAIKU = 'anthropic-haiku-35',
  ANTHROPIC_CLAUDE_3_7_SONNET = 'anthropic-sonnet-37',
  ANTHROPIC_CLAUDE_3_7_SONNET_REASON = 'anthropic-sonnet-37-reasoning',
}
export const CONFIG = {
  // common settings
  COMMON: {
    DEV: true,
    HOSTNAME: '0.0.0.0',
    PORT: 4000,
    HOST_URL: 'http://example.com',
    USER: 'webUser',
  },
  // discord app settings
  DISCORD: {
    // your discord bot app id
    APP_ID: '*******************',
    // register command
    COMMAND_GUILD_ID: ['*******************'],
    // discord bot token
    TOKEN: '******.*********.****-*****-*****',
  },
  GACHA: {
    PICKRATE: 1.0,
  },
  // OpenWeatherMap API KEY
  // OpenWeatherMap; see: https://openweathermap.org/
  FORECAST: {
    // if disabled, still empty.
    KEY: '',
  },
  // YOUTUBE API KEY
  // Google Cloud Platform; see: https://console.cloud.google.com/apis/api/youtube.googleapis.com/metrics
  YOUTUBE: {
    // if disabled, still empty.
    KEY: '',
  },
  // OPENAI API KEY / TOKEN
  // KEY:
  // OpenAI > https://platform.openai.com/
  // TOKEN:
  // GET > https://chat.openai.com/api/auth/session and find accessToken
  OPENAI: {
    // base url
    BASE_URL: 'https://api.openai.com/v1',
    /// org id / project id (optional)
    ORG: undefined,
    PROJECT: undefined,
    // if disabled, still empty.
    KEY: '',
    // default model
    DEFAULT_MODEL: LiteLLMModel.GPT_4_1,
    // G3 command model
    G3_MODEL: LiteLLMModel.GPT_4_1,
    // G4 command model
    G4_MODEL: LiteLLMModel.GPT_4_1,
    // if disabled, still empty.
    ACCESSTOKEN: '',
  },
  NICONICO: {
    ENABLE: true,
    MAIL: '',
    PASSWORD: '',
  },
  DB: {
    HOSTNAME: '127.0.0.1',
    USERNAME: 'user',
    DATABASE: 'database',
    PASSWORD: 'password',
    PORT: 3306,
    FLUSH: false,
  },
};

export const YT_AGENT = ytdl.createAgent();
