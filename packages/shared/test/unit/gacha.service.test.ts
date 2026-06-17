import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Models from '../../src/models/index.js';
import { GachaService } from '../../src/services/gacha.service.js';
import { GachaItem } from '../../src/types/gacha.js';

/**
 * テスト用アイテムを作る (Models.Item 互換)
 */
function makeItem(overrides: {
  id: number;
  name: string;
  rare: string;
  rank: number;
  weight?: number;
  is_present?: number;
  reroll?: number;
  price?: number;
}): Models.Item {
  return {
    id: overrides.id,
    name: overrides.name,
    icon: null,
    rare: overrides.rare,
    description: null,
    weight: overrides.weight ?? 1,
    is_present: overrides.is_present ?? 0,
    reroll: overrides.reroll ?? 0,
    price: overrides.price ?? 0,
    item_rank: { rank: overrides.rank } as Models.ItemRank,
  } as unknown as Models.Item;
}

const ITEM_UUR = makeItem({ id: 1, name: 'すごい景品', rare: 'UUR', rank: 0, is_present: 1, price: 10000 });
const ITEM_C = makeItem({ id: 2, name: 'ふつうのアイテム', rare: 'C', rank: 6 });
const ITEM_TICKET = makeItem({ id: 3, name: 'チケット', rare: 'C', rank: 6, reroll: 1 });

function gachaItemOf(item: Models.Item): GachaItem {
  return {
    item_id: item.id,
    name: item.name,
    icon: item.icon,
    rare: item.rare,
    rank: item.item_rank.rank,
    is_present: item.is_present === 1,
    reroll: item.reroll,
  };
}

beforeEach(() => {
  GachaService.allItemList = [ITEM_UUR, ITEM_C, ITEM_TICKET];
});

afterEach(() => {
  vi.restoreAllMocks();
  GachaService.allItemList = [];
});

describe('GachaService.pickOnce', () => {
  it('確率テーブルに従って等級を決定する (UUR)', () => {
    // 1回目: 等級決定 (0 < UUR確率), 2回目: 重み付き抽選
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    const result = GachaService.pickOnce();
    expect(result.rare).toBe('UUR');
    expect(result.item_id).toBe(ITEM_UUR.id);
    expect(result.is_present).toBe(true);
  });

  it('確率テーブルに従って等級を決定する (C)', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.99).mockReturnValueOnce(0);
    const result = GachaService.pickOnce();
    expect(result.rare).toBe('C');
  });
});

describe('GachaService.simulateExtraPicks', () => {
  it('count モードは指定回数引く', () => {
    vi.spyOn(GachaService, 'pickOnce').mockReturnValue(gachaItemOf(ITEM_C));
    const result = GachaService.simulateExtraPicks({ mode: 'count', count: 5 });
    expect('list' in result && result.list).toHaveLength(5);
  });

  it('target モードは等級が出たら終了する', () => {
    vi.spyOn(GachaService, 'pickOnce')
      .mockReturnValueOnce(gachaItemOf(ITEM_C))
      .mockReturnValueOnce(gachaItemOf(ITEM_UUR));
    const result = GachaService.simulateExtraPicks({ mode: 'target', target: 'UUR', matchByName: true });
    expect('list' in result && result.list).toHaveLength(2);
  });

  it('target モード (matchByName) はアイテム名の部分一致でも終了する', () => {
    vi.spyOn(GachaService, 'pickOnce')
      .mockReturnValueOnce(gachaItemOf(ITEM_C))
      .mockReturnValueOnce(gachaItemOf(ITEM_UUR));
    const result = GachaService.simulateExtraPicks({ mode: 'target', target: 'すごい', matchByName: true });
    expect('list' in result && result.list).toHaveLength(2);
  });

  it('リロール付きで等級一致した場合は続行する', () => {
    vi.spyOn(GachaService, 'pickOnce')
      .mockReturnValueOnce(gachaItemOf(ITEM_TICKET)) // C だが reroll > 0
      .mockReturnValueOnce(gachaItemOf(ITEM_C));
    const result = GachaService.simulateExtraPicks({ mode: 'target', target: 'C', matchByName: false });
    expect('list' in result && result.list).toHaveLength(2);
  });

  it('target モード (matchByName=false) は等級以外の単語なら1回で打ち切る', () => {
    vi.spyOn(GachaService, 'pickOnce').mockReturnValue(gachaItemOf(ITEM_C));
    const result = GachaService.simulateExtraPicks({ mode: 'target', target: 'ノーマッチ', matchByName: false });
    expect('list' in result && result.list).toHaveLength(1);
  });

  it('上限を超えたら LIMIT_EXCEEDED を返す', () => {
    vi.spyOn(GachaService, 'pickOnce').mockReturnValue(gachaItemOf(ITEM_C));
    const result = GachaService.simulateExtraPicks({ mode: 'target', target: 'UUR', matchByName: true });
    expect('error' in result && result.error).toBe('LIMIT_EXCEEDED');
  });
});

describe('GachaService.pickNormal', () => {
  function makeMocks(user: Partial<Models.Users> | null) {
    const usersRepository = {
      get: vi.fn().mockResolvedValue(user),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const gachaRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      getPresents: vi.fn().mockResolvedValue([]),
      usePresent: vi.fn(),
      givePresent: vi.fn(),
    };
    const itemRepository = {
      getAll: vi.fn().mockResolvedValue([ITEM_UUR, ITEM_C, ITEM_TICKET]),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new GachaService(usersRepository as any, gachaRepository as any, itemRepository as any);
    return { service, usersRepository, gachaRepository, itemRepository };
  }

  const baseRequest = { guildId: '100', userId: '1', userName: 'alice' };

  it('残り回数が足りない場合は INSUFFICIENT_PICKS', async () => {
    const { service } = makeMocks({ pick_left: 3 } as Models.Users);
    const result = await service.pickNormal({ ...baseRequest, count: 10 });
    expect(result).toEqual({ type: 'INSUFFICIENT_PICKS', pickLeft: 3 });
  });

  it('通話履歴チェック: 該当ギルドの履歴がなければ NO_VOICE_HISTORY', async () => {
    const { service } = makeMocks({
      pick_left: 10,
      voice_channel_data: [{ gid: 'other-guild', date: new Date() }],
    } as Models.Users);
    const result = await service.pickNormal({ ...baseRequest, requireVoiceActivity: true });
    expect(result).toEqual({ type: 'NO_VOICE_HISTORY' });
  });

  it('通話履歴チェック: 7日以上前なら VOICE_HISTORY_EXPIRED', async () => {
    const old = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8);
    const { service } = makeMocks({
      pick_left: 10,
      voice_channel_data: [{ gid: '100', date: old }],
    } as Models.Users);
    const result = await service.pickNormal({ ...baseRequest, requireVoiceActivity: true });
    expect(result).toEqual({ type: 'VOICE_HISTORY_EXPIRED' });
  });

  it('未登録ユーザーは pick_left 10 で登録され、10回引く (requireVoiceActivity)', async () => {
    const { service, usersRepository, gachaRepository } = makeMocks(null);
    vi.spyOn(GachaService, 'pickOnce').mockReturnValue(gachaItemOf(ITEM_C));

    const result = await service.pickNormal({ ...baseRequest, count: 5, requireVoiceActivity: true });

    expect(usersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', guild_id: '100', pick_left: 10 })
    );
    expect('list' in result && result.list).toHaveLength(10);
    expect(gachaRepository.save).toHaveBeenCalledTimes(1);
  });

  it('通常モード: 残り回数からチケット分を加算して減算する', async () => {
    const { service, usersRepository } = makeMocks({ pick_left: 20 } as Models.Users);
    // 10回中1回チケット (reroll 1)
    const picks = [
      ...Array.from({ length: 9 }, () => gachaItemOf(ITEM_C)),
      gachaItemOf(ITEM_TICKET),
    ];
    const spy = vi.spyOn(GachaService, 'pickOnce');
    picks.forEach((p) => spy.mockReturnValueOnce(p));

    const result = await service.pickNormal({ ...baseRequest, count: 10 });

    expect('list' in result).toBe(true);
    if ('list' in result) {
      expect(result.ticketRolls).toBe(1);
      // 20 - 10 + 1 = 11
      expect(result.pickLeft).toBe(11);
    }
    expect(usersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', pick_left: 11 })
    );
  });

  it('limit モード: チケットを連鎖消費して pickLeft は 0 になる', async () => {
    const { service } = makeMocks({ pick_left: 2 } as Models.Users);
    // 2回 + チケット1枚 → 追加1回
    const spy = vi.spyOn(GachaService, 'pickOnce');
    spy
      .mockReturnValueOnce(gachaItemOf(ITEM_TICKET))
      .mockReturnValueOnce(gachaItemOf(ITEM_C))
      .mockReturnValueOnce(gachaItemOf(ITEM_C));

    const result = await service.pickNormal({ ...baseRequest, limit: true });

    expect('list' in result).toBe(true);
    if ('list' in result) {
      expect(result.list).toHaveLength(3);
      expect(result.pickLeft).toBe(0);
      expect(result.totalRolls).toBe(1);
    }
  });

  it('当選プレゼントを presents として返す', async () => {
    const { service } = makeMocks({ pick_left: 10 } as Models.Users);
    vi.spyOn(GachaService, 'pickOnce')
      .mockReturnValueOnce(gachaItemOf(ITEM_UUR))
      .mockReturnValue(gachaItemOf(ITEM_C));

    const result = await service.pickNormal({ ...baseRequest, count: 10 });

    expect('list' in result).toBe(true);
    if ('list' in result) {
      expect(result.presents).toHaveLength(1);
      expect(result.presents[0].item_id).toBe(ITEM_UUR.id);
    }
  });
});

describe('GachaService.getPresentInfo', () => {
  it('未登録ユーザーは null', async () => {
    const usersRepository = { get: vi.fn().mockResolvedValue(null), save: vi.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new GachaService(usersRepository as any, {} as any, {} as any);
    expect(await service.getPresentInfo('100', '1')).toBeNull();
  });

  it('プレゼント一覧と合計金額を返す', async () => {
    const usersRepository = {
      get: vi.fn().mockResolvedValue({ user_name: 'alice', pick_left: 5 }),
      save: vi.fn(),
    };
    const gachaRepository = {
      getPresents: vi.fn().mockResolvedValue([
        { id: 10, items: { name: 'A', rare: 'UUR', icon: null, price: 100 } },
        { id: 11, items: { name: 'B', rare: 'SSR', icon: '🎁', price: 50 } },
      ]),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new GachaService(usersRepository as any, gachaRepository as any, {} as any);
    const info = await service.getPresentInfo('100', '1');
    expect(info).toEqual({
      userName: 'alice',
      pickLeft: 5,
      presents: [
        { id: 10, name: 'A', rare: 'UUR', icon: null, price: 100 },
        { id: 11, name: 'B', rare: 'SSR', icon: '🎁', price: 50 },
      ],
      totalPrice: 150,
    });
  });
});

describe('GachaService.drawOmikuji', () => {
  it.each([
    [0.0, '大吉'],
    [0.2, '吉'],
    [0.5, '中吉'],
    [0.6, '小吉'],
    [0.7, '末吉'],
    [0.9, '凶'],
    [0.99, '大凶'],
  ])('Math.random() = %f のとき %s', (rnd, luck) => {
    vi.spyOn(Math, 'random').mockReturnValue(rnd);
    expect(GachaService.drawOmikuji().luck).toBe(luck);
  });
});

describe('GachaService.drawOmikujiUntil', () => {
  it('指定の運勢が出たら終了する', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValueOnce(0.0);
    const { list, found } = GachaService.drawOmikujiUntil('大吉');
    expect(found).toBe(true);
    expect(list).toHaveLength(2);
    expect(list[1].luck).toBe('大吉');
  });

  it('上限を超えたら found: false', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // 常に中吉
    const { list, found } = GachaService.drawOmikujiUntil('大吉', 100);
    expect(found).toBe(false);
    expect(list).toHaveLength(101);
  });
});
