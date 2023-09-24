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
    GPT_4_32K = 'gpt-4-32k'
}

type GPTModel = {
    modelName: string;
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
            return { modelName: 'gpt-3.5-turbo', maxTokens: 4096 };
        case ChatGPTModel.GPT_3_16K:
            return { modelName: 'gpt-3.5-turbo-16k', maxTokens: 16384 };
        case ChatGPTModel.GPT_4:
            return { modelName: 'gpt-4', maxTokens: 8192 };
        case ChatGPTModel.GPT_4_32K:
            return { modelName: 'gpt-4', maxTokens: 32768 };
        default:
            return { modelName: 'gpt-3.5-turbo', maxTokens: 4096 };
    }
};

/**
 * ChatGPTの初期化
 * @param gid
 */
export async function initalize(
    gid: string,
    type?: 'default' | 'proxy',
    modelName?: ChatGPTModel
): Promise<GPTChatData> {
    const model = getGPTModel(modelName ?? ChatGPTModel.GPT_3);
    const chat = GPT.chat.find((c) => c.guild === gid);
    if (!chat) {
        GPT.chat.push({
            guild: gid,
            GPT: initGPT(type ? type : 'default', model),
            type: type ? type : 'default',
            messages: [],
            timestamp: dayjs()
        });
        await Logger.put({
            guild_id: gid,
            channel_id: undefined,
            user_id: undefined,
            level: LogLevel.INFO,
            event: 'init-gpt',
            message: [`Model: ${modelName}, Token: ${model.maxTokens}`]
        });
        // chat is pushed, so it is not undefined
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return GPT.chat.find((c) => c.guild === gid)!;
    }
    if (type && chat.type !== type) {
        await Logger.put({
            guild_id: gid,
            channel_id: undefined,
            user_id: undefined,
            level: LogLevel.INFO,
            event: 'gpt: type-change',
            message: [`Model: ${modelName}, Token: ${model.maxTokens}, Type: ${type}`]
        });
        chat.type = type ? type : 'default';
        chat.GPT = initGPT(type ? type : 'default', model);
    }
    return chat;
}

/**
 * GPTAPIの初期化
 * @param type
 * @param model
 * @returns
 */
const initGPT = (type: 'default' | 'proxy', model: GPTModel): ChatGPTAPI | ChatGPTUnofficialProxyAPI => {
    if (!type || type === 'default') {
        return new ChatGPTAPI({
            apiKey: CONFIG.OPENAI.KEY,
            maxModelTokens: model.maxTokens,
            completionParams: {
                model: model.modelName
            },
            systemMessage: CHATBOT_TEMPLATE
        });
    }
    return new ChatGPTUnofficialProxyAPI({
        accessToken: CONFIG.OPENAI.ACCESSTOKEN,
        apiReverseProxyUrl: 'https://ai.fakeopen.com/api/conversation',
        model: model.modelName
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
    guild: string;
    GPT: ChatGPTAPI | ChatGPTUnofficialProxyAPI;
    type: 'default' | 'proxy';
    messages: {
        cid?: string;
        id: string;
        message: string;
    }[];
    timestamp: dayjs.Dayjs;
}
