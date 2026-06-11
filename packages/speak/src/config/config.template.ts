export const LITELLM_MODEL = {
  GPT_4O: 'chatgpt-4o-latest',
  GPT_5: 'gpt-5-chat-latest',
  GPT_5_1: 'gpt-5.1-chat-latest',
  GPT_5_2: 'gpt-5.2-chat-latest',
  GPT_5_THINKING: 'gpt-5-chat-latest-thinking',
  GPT_5_MINI: 'gpt-5-mini',
  GPT_5_NANO: 'gpt-5-nano',
  CLAUDE_4_5_SONNET: 'claude-sonnet-4-5',
  CLAUDE_4_6_SONNET: 'claude-sonnet-4-6',
  CLAUDE_4_6_OPUS: 'claude-opus-4-6',
  GROK_4: 'xai/grok-4-latest',
  GROK_4_FAST: 'xai/grok-4-fast-non-reasoning',
  GPT_5_4: 'gpt-5.4',
} as const;

export type LiteLLMModel = (typeof LITELLM_MODEL)[keyof typeof LITELLM_MODEL];

export const CONFIG = {
  TOKEN: 'YOUR_BOT_TOKEN',
  APP_ID: 'YOUR_APP_ID',
  NAME: 'BOT_NAME',
  DB: {
    HOSTNAME: 'localhost',
    USERNAME: 'orange',
    DATABASE: 'orangebot',
    PASSWORD: 'PASSWORD',
    PORT: 3306,
    FLUSH: false,
  },
  OPENAI: {
    BASE_URL: 'https://localhost:4001/v1',
    ORG: 'OPENAI_ORG_ID',
    PROJECT: 'OPENAI_PROJECT_ID',
    KEY: 'OPENAI_API_KEY',
    DEFAULT_MODEL: LITELLM_MODEL.CLAUDE_4_6_SONNET,
  },
  PORT: 4100,
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
};

export type CommandConfig = {
  TOKEN: string;
  APP_ID: string;
  NAME: string;
  PORT: number;
  COMMAND: {
    SPEAK: {
      COMMAND_NAME: string;
      SLASH_COMMAND_NAME: string;
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
