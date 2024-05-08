import { OpenAI } from 'openai';
import { CHATBOT_TEMPLATE } from '../constants.js';
import { CONFIG, ChatGPTModel } from '../../config/config.js';
import dayjs from 'dayjs';
import { ChatCompletionMessageParam } from 'openai/resources';

export const gptList = { gpt: [] as ChatGPT[] };

export async function initalize(id: string, model: ChatGPTModel, mode: GPTMode, isGuild: boolean) {
    const openai = new OpenAI({
        organization: CONFIG.OPENAI.ORG,
        project: CONFIG.OPENAI.PROJECT,
        apiKey: CONFIG.OPENAI.KEY,
        maxRetries: 3,
    });
    const gpt: ChatGPT = {
        id,
        openai: openai,
        model: model,
        chat: [],
        isGuild: isGuild,
        timestamp: dayjs(),
    };
    if(mode === GPTMode.DEFAULT) {
        gpt.chat.push({
            role: Role.SYSTEM,
            content: CHATBOT_TEMPLATE
        });
    }
    return gpt;
}

export type ChatGPT = {
    id: string;
    openai: OpenAI;
    model: ChatGPTModel;
    chat: ChatCompletionMessageParam[];
    isGuild: boolean;
    timestamp: dayjs.Dayjs;
};

export enum GPTMode {
    DEFAULT = 'default',
    NOPROMPT = 'no_prompt'
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type VisionMessage = {
    role: Role;
    content: VisionContent;
}

type VisionContent = {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
};

export enum Role {
    SYSTEM = 'system',
    USER = 'user',
    ASSISTANT = 'assistant',
};