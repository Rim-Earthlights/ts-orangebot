import dayjs from 'dayjs';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { CONFIG, LiteLLMModel } from '../../config/config.js';
import { CHATBOT_TEMPLATE } from '../constants.js';
import { CacheType, ChatInputCommandInteraction, Message } from 'discord.js';

export const llmList = { llm: [] as LiteLLM[] };

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
    uuid: crypto.randomUUID(),
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

export function getIdInfoMessage(message: Message) {
  const guild = message.guild;
  if (!guild) {
    return { id: message.author.id, name: message.author.displayName, isGuild: false };
  }
  return { id: guild.id, name: message.guild?.name, isGuild: true };
}

export function getIdInfoInteraction(interaction: ChatInputCommandInteraction<CacheType>) {
  const guild = interaction.guild;
  if (!guild) {
    return {
      id: interaction.user.id,
      name: interaction.user.displayName,
      isGuild: false,
    };
  }
  return { id: guild.id, name: interaction.guild?.name, isGuild: true };
}

export type LiteLLM = {
  id: string;
  uuid: string;
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
