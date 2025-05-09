import dayjs from 'dayjs';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { CONFIG, LiteLLMModel } from '../../config/config.js';
import { CHATBOT_TEMPLATE } from '../constants.js';

export const llmList = { gpt: [] as LiteLLM[] };

export async function initalize(id: string, model: LiteLLMModel, mode: LiteLLMMode, isGuild: boolean) {
  const litellm = new OpenAI({
    organization: CONFIG.OPENAI.ORG,
    project: CONFIG.OPENAI.PROJECT,
    apiKey: CONFIG.OPENAI.KEY,
    maxRetries: 3,
    baseURL: CONFIG.OPENAI.BASE_URL,
  });
  const llm: LiteLLM = {
    id,
    litellm: litellm,
    model: model,
    chat: [],
    isGuild: isGuild,
    memory: false,
    timestamp: dayjs(),
  };
  if (mode === LiteLLMMode.DEFAULT) {
    llm.chat.push({
      role: Role.SYSTEM,
      content: CHATBOT_TEMPLATE,
    });
  }
  return llm;
}

export type LiteLLM = {
  id: string;
  litellm: OpenAI;
  model: LiteLLMModel;
  chat: ChatCompletionMessageParam[];
  isGuild: boolean;
  memory: boolean;
  timestamp: dayjs.Dayjs;
};

export enum LiteLLMMode {
  DEFAULT = 'default',
  NOPROMPT = 'no_prompt',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type VisionMessage = {
  role: Role;
  content: VisionContent;
};

type VisionContent = {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
};

export enum Role {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}
