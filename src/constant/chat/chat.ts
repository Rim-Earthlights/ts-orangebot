import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from 'chatgpt';
import dayjs from 'dayjs';
import { CONFIG } from '../../config/config.js';
import { CHATBOT_TEMPLATE } from '../constants.js';
import { Logger } from '../../common/logger.js';
import { LogLevel } from '../../type/types.js';

/**
 * ChatGPTのモデル
 */
export enum ChatGPTModel {
    GPT_3 = 'gpt-3.5-turbo',
    GPT_3_16K = 'gpt-3.5-turbo-16k',
    GPT_4 = 'gpt-4',
    GPT_4_32K = 'gpt-4-32k',
    GPT_4_HALF = 'gpt-4-half'
}

type GPTModel = {
    modelName: ChatGPTModel;
    maxTokens: number;
};

/**
 * GPTモデル取得
 * @param modelName
 * @returns
 */
export const getGPTModel = (modelName: ChatGPTModel): GPTModel => {
    switch (modelName) {
        case ChatGPTModel.GPT_3:
            return { modelName: ChatGPTModel.GPT_3, maxTokens: 4096 };
        case ChatGPTModel.GPT_3_16K:
            return { modelName: ChatGPTModel.GPT_3_16K, maxTokens: 16384 };
        case ChatGPTModel.GPT_4:
            return { modelName: ChatGPTModel.GPT_4, maxTokens: 8192 };
        case ChatGPTModel.GPT_4_32K:
            // 32k model is integrated into 8k model.
            return { modelName: ChatGPTModel.GPT_4, maxTokens: 32768 };
        case ChatGPTModel.GPT_4_HALF:
            return { modelName: ChatGPTModel.GPT_4, maxTokens: 4096 };
        default:
            return { modelName: ChatGPTModel.GPT_3, maxTokens: 4096 };
    }
};

/**
 * ChatGPTの初期化
 * @param id
 */
export async function initalize(
    id: string,
    isDM: boolean,
    mode?: GPTMode,
    modelName?: ChatGPTModel
): Promise<GPTChatData> {
    const model = getGPTModel(modelName ?? ChatGPTModel.GPT_3);
    const chat = GPT.chat.find((c) => c.id === id);
    if (!chat) {
        GPT.chat.push({
            id: id,
            GPT: initGPT(mode ? mode : GPTMode.DEFAULT, model),
            mode: mode ? mode : GPTMode.DEFAULT,
            type: isDM ? GPTType.USER : GPTType.GUILD,
            messages: [],
            timestamp: dayjs()
        });
        await Logger.put({
            guild_id: isDM ? undefined : id,
            channel_id: undefined,
            user_id: isDM ? id : undefined,
            level: LogLevel.INFO,
            event: 'init-gpt',
            message: [`Model: ${modelName}, Token: ${model.maxTokens}`]
        });
        // chat is pushed, so it is not undefined
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return GPT.chat.find((c) => c.id === id)!;
    }
    if (mode && chat.mode !== mode) {
        await Logger.put({
            guild_id: isDM ? undefined : id,
            channel_id: undefined,
            user_id: isDM ? id : undefined,
            level: LogLevel.INFO,
            event: 'gpt: type-change',
            message: [`Model: ${modelName}, Token: ${model.maxTokens}, Type: ${mode}`]
        });
        chat.mode = mode ? mode : GPTMode.DEFAULT;
        chat.GPT = initGPT(mode ? mode : GPTMode.DEFAULT, model);
    }
    return chat;
}

/**
 * GPTAPIの初期化
 * @param mode
 * @param model
 * @returns
 */
const initGPT = (mode: GPTMode, model: GPTModel): ChatGPTAPI | ChatGPTUnofficialProxyAPI => {
    return new ChatGPTAPI({
        apiKey: CONFIG.OPENAI.KEY,
        maxModelTokens: model.maxTokens,
        completionParams: {
            model: model.modelName
        },
        systemMessage: mode === GPTMode.DEFAULT ? CHATBOT_TEMPLATE : undefined
    });
};

/**
 * GPTの会話データ
 */
export const GPT = {
    chat: [] as GPTChatData[]
};

/**
 * GPTの会話データ構造体
 */
export interface GPTChatData {
    id: string;
    GPT: ChatGPTAPI | ChatGPTUnofficialProxyAPI;
    mode: GPTMode;
    type: GPTType;
    messages: {
        cid?: string;
        id: string;
        message: string;
    }[];
    timestamp: dayjs.Dayjs;
}

export enum GPTMode {
    DEFAULT = 'default',
    NOPROMPT = 'NOPROMPT'
}
export enum GPTType {
    GUILD = 'GUILD',
    USER = 'USER'
}
