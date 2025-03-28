import ytdl from '@distube/ytdl-core';

export enum ChatGPTModel {
  GPT_3 = 'gpt-3.5-turbo',
  GPT_3_16K = 'gpt-3.5-turbo-16k',
  GPT_4 = 'gpt-4',
  GPT_4_32K = 'gpt-4-32k',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_4_VISION_PREVIEW = 'gpt-4-vision-preview',
}

export const CONFIG = {
  // common settings
  COMMON: {
    DEV: true,
    HOSTNAME: '0.0.0.0',
    PORT: 4000,
    HOST_URL: 'http://exsample.com',
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
    DEFAULT_MODEL: ChatGPTModel.GPT_4,
    // G3 command model
    G3_MODEL: ChatGPTModel.GPT_3_16K,
    // G4 command model
    G4_MODEL: ChatGPTModel.GPT_4_32K,
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
