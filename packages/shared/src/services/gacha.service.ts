import { getRndNumber } from '../common/random.js';
import { GACHA_RARE_TIERS, GachaPercents } from '../constants/gacha.js';
import * as Models from '../models/index.js';
import { GachaRepository } from '../repository/gachaRepository.js';
import { ItemRepository } from '../repository/itemRepository.js';
import { UsersRepository } from '../repository/usersRepository.js';
import {
  GachaItem,
  GachaPickError,
  GachaPickRequest,
  GachaPickResult,
  GachaPresentInfo,
  GachaSimulateOptions,
  GachaSimulateResult,
  Omikuji,
  PresentTransaction,
} from '../types/gacha.js';

/** 通話参加履歴の有効期間 (7日) */
const VOICE_ACTIVITY_LIMIT_MS = 1000 * 60 * 60 * 24 * 7;
/** 拡張ガチャの試行上限 */
const SIMULATE_LIMIT = 1_000_000;

/** ユニットテストでリポジトリをモックできるよう、利用メソッドのみを依存として宣言する */
type UsersRepositoryLike = Pick<UsersRepository, 'get' | 'save'>;
type GachaRepositoryLike = Pick<GachaRepository, 'save' | 'getPresents' | 'usePresent' | 'givePresent'>;
type ItemRepositoryLike = Pick<ItemRepository, 'getAll'>;

/**
 * ガチャの当選結果を重み付けして取得する
 */
function getWeight(list: Models.Item[]): Models.Item[] {
  const weightList = [];

  for (const gacha of list) {
    for (let i = 0; i < gacha.weight; i++) {
      weightList.push(gacha);
    }
  }

  return weightList;
}

/**
 * ガチャ抽選・プレゼント管理サービス (Discord 非依存)
 */
export class GachaService {
  /** 抽選対象のアイテムキャッシュ (起動時に ItemRepository.getAll() の結果をセットする) */
  static allItemList: Models.Item[] = [];

  constructor(
    private readonly usersRepository: UsersRepositoryLike = new UsersRepository(),
    private readonly gachaRepository: GachaRepositoryLike = new GachaRepository(),
    private readonly itemRepository: ItemRepositoryLike = new ItemRepository()
  ) {}

  /**
   * ランダムにガチャを一度引き、等級を返す
   */
  static pickOnce(): GachaItem {
    const rnd = Math.random();

    if (rnd < GachaPercents.UUR) {
      return GachaService.convertGacha('UUR');
    } else if (rnd < GachaPercents.UR) {
      return GachaService.convertGacha('UR');
    } else if (rnd < GachaPercents.SSR) {
      return GachaService.convertGacha('SSR');
    } else if (rnd < GachaPercents.SR) {
      return GachaService.convertGacha('SR');
    } else if (rnd < GachaPercents.R) {
      return GachaService.convertGacha('R');
    } else if (rnd < GachaPercents.UC) {
      return GachaService.convertGacha('UC');
    } else {
      return GachaService.convertGacha('C');
    }
  }

  /**
   * 当選結果からランダムにガチャを引く
   */
  private static convertGacha(rare: string): GachaItem {
    const itemList = GachaService.allItemList.filter((i) => i.rare === rare);
    const weightList = getWeight(itemList);

    const index = getRndNumber(1, weightList.length) - 1;

    return {
      item_id: weightList[index].id,
      name: weightList[index].name,
      icon: weightList[index].icon,
      rare: weightList[index].rare,
      rank: weightList[index].item_rank.rank,
      is_present: weightList[index].is_present === 1,
      reroll: weightList[index].reroll,
    };
  }

  /**
   * 景品無効の拡張ガチャを引く (DB への保存なし)
   * - count モード: 指定回数引く
   * - target モード: 指定の等級 (または matchByName 時はアイテム名部分一致) が出るまで引く
   */
  static simulateExtraPicks(options: GachaSimulateOptions): GachaSimulateResult {
    const list: GachaItem[] = [];

    if (options.mode === 'count') {
      for (let i = 0; i < options.count; i++) {
        list.push(GachaService.pickOnce());
      }
      return { list };
    }

    const target = options.target;
    const isRareTier = GACHA_RARE_TIERS.some((r) => r === target.toUpperCase());

    do {
      const gacha = GachaService.pickOnce();
      list.push(gacha);

      if (options.matchByName) {
        // .gacha extra 互換: 等級一致 (リロールなし) またはアイテム名の部分一致で終了
        if (gacha.rare === target.toUpperCase() && gacha.reroll === 0) {
          break;
        }
        if (gacha.name.includes(target) && !isRareTier) {
          break;
        }
      } else {
        // /gacha extra 互換: 等級一致 (リロールなし) で終了、等級以外の単語は1回で打ち切り
        if (gacha.rare === target && gacha.reroll === 0) {
          break;
        }
        if (!isRareTier) {
          break;
        }
      }

      if (list.length > SIMULATE_LIMIT) {
        return { error: 'LIMIT_EXCEEDED', attempts: list.length };
      }
      // eslint-disable-next-line no-constant-condition
    } while (true);

    return { list };
  }

  /**
   * 通常ガチャを引き、結果を保存する
   * @returns 結果またはエラー
   */
  async pickNormal(request: GachaPickRequest): Promise<GachaPickResult | GachaPickError> {
    const { guildId, userId, userName } = request;
    const limit = request.limit ?? false;

    const user = await this.usersRepository.get(guildId, userId);

    let num: number;
    if (limit) {
      num = user?.pick_left ? user.pick_left : 1;
    } else {
      num = request.count ?? 10;
    }

    if (user) {
      if (request.requireVoiceActivity && user.voice_channel_data?.length) {
        const vc = user.voice_channel_data.find((v) => v.gid === guildId);
        if (!vc) {
          return { type: 'NO_VOICE_HISTORY' };
        }
        const diff = new Date().getTime() - new Date(vc.date).getTime();
        if (diff >= VOICE_ACTIVITY_LIMIT_MS) {
          return { type: 'VOICE_HISTORY_EXPIRED' };
        }
      }

      if (user.pick_left < num) {
        return { type: 'INSUFFICIENT_PICKS', pickLeft: user.pick_left };
      }
    } else {
      await this.usersRepository.save({
        id: userId,
        guild_id: guildId,
        user_name: userName,
        pick_left: 10,
        ...(request.requireVoiceActivity
          ? { voice_channel_data: [{ gid: guildId, date: new Date() }] }
          : {}),
      });
      // 新規ユーザーは初期持ち回数の10回を引く (.gacha コマンド互換)
      if (request.requireVoiceActivity) {
        num = 10;
      }
    }

    const list: GachaItem[] = [];
    for (let i = 0; i < num; i++) {
      list.push(GachaService.pickOnce());
    }

    // チケットを引いた分だけ加算する
    const ticketRolls = list
      .filter((g) => g.reroll > 0)
      .reduce(function (sum, element) {
        return sum + element.reroll;
      }, 0);

    let totalRolls = ticketRolls;
    if (limit) {
      let tickets = ticketRolls;

      do {
        let tempList = 0;
        if (tickets <= 0) {
          break;
        }
        for (let i = 0; i < tickets; i++) {
          const gacha = GachaService.pickOnce();
          list.push(gacha);
          if (gacha.reroll > 0) {
            tempList += gacha.reroll;
          }
        }
        tickets = tempList;
        totalRolls += tickets;
        // eslint-disable-next-line no-constant-condition
      } while (true);
    }

    const nowTime = new Date();
    await this.gachaRepository.save(
      list.map((g) => {
        return {
          user_id: userId,
          item_id: g.item_id,
          pick_date: nowTime,
          is_used: 0,
        };
      })
    );

    const items = await this.itemRepository.getAll();
    let pickLeft = 0;
    if (!limit) {
      pickLeft = (user ? user.pick_left : 10) - num + ticketRolls;
    }

    await this.usersRepository.save({
      id: userId,
      guild_id: guildId,
      user_name: userName,
      last_pick_date: nowTime,
      pick_left: pickLeft,
    });

    const presents = list.filter((g) => items.find((i) => i.id === g.item_id)?.is_present === 1);

    return { list, ticketRolls, totalRolls, pickLeft, presents };
  }

  /**
   * プレゼント一覧情報を取得する
   * @returns ユーザー未登録の場合は null
   */
  async getPresentInfo(guildId: string, userId: string): Promise<GachaPresentInfo | null> {
    const user = await this.usersRepository.get(guildId, userId);
    if (user?.pick_left == undefined) {
      return null;
    }

    const gachaList = await this.gachaRepository.getPresents(userId, false);
    const presents = gachaList.map((p) => {
      return {
        id: p.id,
        name: p.items.name,
        rare: p.items.rare,
        icon: p.items.icon,
        price: p.items.price,
      };
    });
    const totalPrice = gachaList.reduce((prev, current) => {
      return prev + current.items.price;
    }, 0);

    return {
      userName: user.user_name,
      pickLeft: user.pick_left,
      presents,
      totalPrice,
    };
  }

  /**
   * プレゼントを使用する
   * @returns 見つからない場合は null
   */
  async usePresent(presentId: number): Promise<PresentTransaction | null> {
    const result = await this.gachaRepository.usePresent(presentId);
    if (!result) {
      return null;
    }
    return { userId: result.user_id, itemName: result.items.name };
  }

  /**
   * プレゼントを渡す
   * @returns 見つからない場合は null
   */
  async givePresent(userId: string, itemId: number): Promise<PresentTransaction | null> {
    const result = await this.gachaRepository.givePresent(userId, itemId);
    if (!result) {
      return null;
    }
    return { userId, itemName: result.items.name };
  }

  /**
   * ランダムにおみくじを一度引く
   */
  static drawOmikuji(): Omikuji {
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
      description,
    };
  }

  /**
   * 指定の運勢が出るまでおみくじを引く
   * @param target 運勢 (大吉 等)
   * @param max 試行上限 (既定 500)
   */
  static drawOmikujiUntil(target: string, max = 500): { list: Omikuji[]; found: boolean } {
    const list: Omikuji[] = [];

    do {
      const o = GachaService.drawOmikuji();
      list.push(o);
      if (o.luck === target) {
        return { list, found: true };
      }
      if (list.length > max) {
        return { list, found: false };
      }
      // eslint-disable-next-line no-constant-condition
    } while (true);
  }
}
