import dayjs from 'dayjs';

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
