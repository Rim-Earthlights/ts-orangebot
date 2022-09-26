import { getRndNumber } from '../../common/common';
import { GACHA_MONEY_LIST } from '../../constant/gacha/gachaList';

/**
 * ランダムにおみくじを一度引く
 * @returns
 */
export function getGacha(): Gacha {
    const rnd = Math.random();
    let rare;
    let description;
    let rank;

    if (rnd < 0.00009) {
        rare = 'UUR';
        const index = getRndNumber(1, GACHA_MONEY_LIST.UUR.length) - 1;
        description = `:crown: ${GACHA_MONEY_LIST.UUR[index]}`;
        rank = 0;
    } else if (rnd < 0.00068) {
        rare = 'UR';
        const index = getRndNumber(1, GACHA_MONEY_LIST.UR.length) - 1;
        description = `:sparkles: ${GACHA_MONEY_LIST.UR[index]}`;
        rank = 1;
    } else if (rnd < 0.028) {
        rare = 'SSR';
        const index = getRndNumber(1, GACHA_MONEY_LIST.SSR.length) - 1;
        description = `${GACHA_MONEY_LIST.SSR[index].includes('ガチャ+') ? ':tickets:' : ':star:'} ${
            GACHA_MONEY_LIST.SSR[index]
        }`;
        rank = 2;
    } else if (rnd < 0.168) {
        rare = 'SR';
        const index = getRndNumber(1, GACHA_MONEY_LIST.SR.length) - 1;
        description = `${GACHA_MONEY_LIST.SR[index].includes('ガチャ+') ? ':tickets:' : ''} ${
            GACHA_MONEY_LIST.SR[index]
        }`;
        rank = 3;
    } else if (rnd < 0.678) {
        rare = 'R';
        const index = getRndNumber(1, GACHA_MONEY_LIST.R.length) - 1;
        description = ` ${GACHA_MONEY_LIST.R[index]}`;
        rank = 4;
    } else if (rnd < 0.89) {
        rare = 'UC';
        const index = getRndNumber(1, GACHA_MONEY_LIST.UC.length) - 1;
        description = `${GACHA_MONEY_LIST.UC[index]}`;
        rank = 5;
    } else {
        rare = 'C';
        const index = getRndNumber(1, GACHA_MONEY_LIST.C.length) - 1;
        description = `${GACHA_MONEY_LIST.C[index]}`;
        rank = 6;
    }
    return {
        rare,
        description,
        rank
    };
}

/**
 * ランダムにおみくじを一度引く
 * @returns
 */
export function getOmikuji(): Omikuji {
    const rnd = Math.random();
    let luck = '';
    let description = '';

    if (rnd < 0.141) {
        luck = '大吉';
        description = 'おめでとういいことあるよ！！！';
    } else if (rnd < 0.426) {
        luck = '吉';
        description = '結構よき！誇っていいよ！';
    } else if (rnd < 0.56) {
        luck = '中吉';
        description = 'それなりにいいことありそう。';
    } else if (rnd < 0.692) {
        luck = '小吉';
        description = 'ふつうがいちばんだよね。';
    } else if (rnd < 0.831) {
        luck = '末吉';
        description = 'まあこういうときもあるよね。';
    } else if (rnd < 0.975) {
        luck = '凶';
        description = '気をつけようね。';
    } else {
        luck = '大凶';
        description = '逆にレアだしポジティブに考えてこ';
    }
    return {
        luck,
        description
    };
}

export interface Gacha {
    rare: string;
    description: string;
    rank: number;
}

export interface Omikuji {
    luck: string;
    description: string;
}
