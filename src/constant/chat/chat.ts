import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from 'chatgpt';
import dayjs from 'dayjs';
import { CONFIG } from '../../config/config.js';
import * as logger from '../../common/logger.js';
import { CHATBOT_TEMPLATE } from '../constants.js';

/**
 * ChatGPTのモデル
 */
export enum ChatGPTModel {
    GPT_3 = 'gpt-3.5-turbo',
    GPT_3_16K = 'gpt-3.5-turbo-16k',
    GPT_4 = 'gpt-4',
    GPT_4_32K = 'gpt-4-32k'
}

/**
 * ChatGPTのMaxTokenを返す
 * @param model
 * @returns
 */
export const getMaxTokens = (model: ChatGPTModel): number => {
    switch (model) {
        case ChatGPTModel.GPT_3:
            return 4096;
        case ChatGPTModel.GPT_3_16K:
            return 16384;
        case ChatGPTModel.GPT_4:
            return 8192;
        case ChatGPTModel.GPT_4_32K:
            return 32768;
    }
};

/**
 * ChatGPTの初期化
 * @param gid
 */
export async function initalize(gid: string, type?: 'default' | 'proxy', model?: ChatGPTModel): Promise<GPTChatData> {
    const chat = GPT.chat.find((c) => c.guild === gid);
    if (!chat) {
        GPT.chat.push({
            guild: gid,
            GPT: getGPT(type ? type : 'default', model ? model : ChatGPTModel.GPT_3),
            type: type ? type : 'default',
            messages: [],
            timestamp: dayjs()
        });
        await logger.put({
            guild_id: gid,
            channel_id: undefined,
            user_id: undefined,
            level: 'info',
            event: 'init-gpt',
            message: `Model: ${model}, Token: ${getMaxTokens(model ? model : ChatGPTModel.GPT_3)}`
        });
        console.log();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return GPT.chat.find((c) => c.guild === gid)!;
    }
    if (type && chat.type !== type) {
        chat.type = type ? type : 'default';
        chat.GPT = getGPT(type, model ? model : ChatGPTModel.GPT_3);
    }
    return chat;
}

const getGPT = (type: 'default' | 'proxy', model: ChatGPTModel): ChatGPTAPI | ChatGPTUnofficialProxyAPI => {
    if (!type || type === 'default') {
        return new ChatGPTAPI({
            apiKey: CONFIG.OPENAI.KEY,
            maxModelTokens: getMaxTokens(model),
            completionParams: {
                model: model
            },
            systemMessage: CHATBOT_TEMPLATE
        });
    }
    return new ChatGPTUnofficialProxyAPI({
        accessToken: CONFIG.OPENAI.ACCESSTOKEN,
        apiReverseProxyUrl: 'https://ai.fakeopen.com/api/conversation',
        model: model
    });
};

/**
 * GPTクラス
 */
export class GPT {
    static chat: GPTChatData[] = [];
}

/**
 * GPTの会話データ
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
