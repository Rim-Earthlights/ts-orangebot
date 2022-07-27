import { arrayEquals, getRndNumber } from '../../common/common';
import { DiceRole, DICE_ROLE } from '../../constant/dice/dice';

/**
 * チンチロリンを振る 出た場合は回数未満でも終了する
 * @param n 回数
 */
export function getCelo(n: number): DiceRole[] {
    const celo = [];
    for (let i = 0; i < n; i++) {
        const temp = getRole();
        celo.push(temp);
        if (temp.rank > 0) {
            break;
        }
        if (temp.rank === DICE_ROLE.DICE_HIFUMI.rank) {
            break;
        }
    }

    return celo;
}

/**
 * チンチロリンを一度振る
 * @returns
 */
export function getRole(): DiceRole {
    const dice: number[] = [];
    for (let i = 0; i < 3; i++) {
        dice.push(getRndNumber(1, 6));
    }

    // ゾロ目判定
    if (dice.every((d) => d === dice[0])) {
        if (dice[0] === 1) {
            return { ...DICE_ROLE.DICE_PINZORO, dice };
        }
        const power = dice[0];
        const role = DICE_ROLE.DICE_ZORO.role.replace('%POWER%', power.toString());
        return { ...DICE_ROLE.DICE_ZORO, role, power, dice };
    }
    // ヒフミ, シゴロ
    if (arrayEquals(dice, [1, 2, 3])) {
        return { ...DICE_ROLE.DICE_HIFUMI, dice };
    }
    if (arrayEquals(dice, [4, 5, 6])) {
        return { ...DICE_ROLE.DICE_SHIGORO, dice };
    }
    dice.sort();

    // 3つの数字をソートして数字が被ってる場合は
    // 真ん中の数字を取ればどちらかと必ずかぶるはず
    if (dice[0] === dice[1] || dice[1] === dice[2]) {
        const power = dice.filter((d) => d !== dice[1])[0];
        const role = DICE_ROLE.DICE_POWER.role.replace('%POWER%', power.toString());
        return { ...DICE_ROLE.DICE_POWER, role, power, dice };
    }

    return { ...DICE_ROLE.DICE_MENASHI, dice };
}

export function judge(t: DiceRole, v: DiceRole) {
    const rank = t.rank - v.rank;
    if (rank !== 0) {
        if (rank > 0) {
            return 1;
        }
        return -1;
    }
    if (t.power && v.power) {
        const power = t.power - v.power;
        if (power !== 0) {
            if (power > 0) {
                return 1;
            }
            return -1;
        }
    }
    return 0;
}
