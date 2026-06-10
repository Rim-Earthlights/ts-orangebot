// LiteLLM proxy server models
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

// TOKEN / APP_ID / NAME / COMMAND / PORT は起動時に
// インスタンス別 JSON (process.argv[2]) の値で上書きされる
export const CONFIG = {
  TOKEN: 'YOUR_BOT_TOKEN',
  APP_ID: 'YOUR_APP_ID',
  NAME: 'BOT_NAME',
  PORT: 4100,
  DB: {
    HOSTNAME: 'localhost',
    USERNAME: 'orange',
    PASSWORD: 'PASSWORD',
    PORT: 3306,
    DATABASE: 'orangebot',
  },
  COMMAND: {
    SPEAK: {
      COMMAND_NAME: 'speak',
      SLEEP_TIME: 0,
    },
    SPEAKER_CONFIG: {
      ENABLE: true,
      COMMAND_NAME: 'speaker-config',
      COMMAND_NAME_SHORT: 'spcon',
      COMMAND_RESET: 'sp-reload',
    },
    DISCONNECT: 'discon',
  },
  OPENAI: {
    KEY: 'YOUR_OPENAI_KEY',
    ORG: 'YOUR_OPENAI_ORG',
    PROJECT: 'YOUR_OPENAI_PROJECT',
    BASE_URL: 'http://localhost:4000',
    DEFAULT_MODEL: LiteLLMModel.GPT_4_1 as LiteLLMModel,
  },
};

export type CommandConfig = {
  TOKEN: string;
  APP_ID: string;
  NAME: string;
  PORT: number;
  COMMAND: {
    SPEAK: {
      COMMAND_NAME: string;
      SLEEP_TIME: number;
    };
    SPEAKER_CONFIG: {
      ENABLE: boolean;
      COMMAND_NAME: string;
      COMMAND_NAME_SHORT: string;
      COMMAND_RESET: string;
    };
    DISCONNECT: string;
  };
};
