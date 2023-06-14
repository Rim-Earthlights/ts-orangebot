import dayjs from 'dayjs';

export enum ChatGPTModel {
    GPT_3 = 'gpt-3.5-turbo',
    GPT_3_16K = 'gpt-3.5-turbo-16k',
    GPT_4 = 'gpt-4',
    GPT_4_32K = 'gpt-4-32k'
}

export const getMaxTokens = (model: ChatGPTModel): number => {
    switch (model) {
        case ChatGPTModel.GPT_3:
            return 4096;
        case ChatGPTModel.GPT_3_16K:
            return 16384;
        case ChatGPTModel.GPT_4:
            return 4096;
        case ChatGPTModel.GPT_4_32K:
            return 32768;
    }
};

export class GPT {
    static chat: {
        guild: string;
        parentMessageId: {
            cid?: string;
            id: string;
            message: string;
        }[];
        mode: 'normal' | 'custom';
        timestamp: dayjs.Dayjs;
    }[] = [];
}
