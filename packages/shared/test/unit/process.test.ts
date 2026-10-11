import { afterEach, describe, expect, it, vi } from 'vitest';
import { findMissingConfig, runShutdownSteps, withErrorLog } from '../../src/common/process.js';
import { LogData, LogLevel, LoggerPort, setLogger } from '../../src/types/log.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('withErrorLog', () => {
  it('ハンドラに引数をそのまま渡す', async () => {
    const handler = vi.fn();
    await withErrorLog('event', handler)('a', 1);
    expect(handler).toHaveBeenCalledWith('a', 1);
  });

  it('ハンドラの例外を握りつぶして ERROR ログに残す', async () => {
    const logs: LogData[] = [];
    const logger: LoggerPort = { put: async (data) => void logs.push(data) };
    setLogger(logger);

    const wrapped = withErrorLog('message-create', async () => {
      throw new Error('boom');
    });

    await expect(wrapped()).resolves.toBeUndefined();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe(LogLevel.ERROR);
    expect(logs[0].event).toBe('message-create');
    expect(logs[0].message?.[0]).toContain('boom');
  });

  it('ログ出力が失敗しても例外を投げない', async () => {
    setLogger({
      put: async () => {
        throw new Error('db down');
      },
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapped = withErrorLog('event', () => {
      throw new Error('boom');
    });

    await expect(wrapped()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});

describe('findMissingConfig', () => {
  it('未設定の値のキー名だけを返す', () => {
    expect(
      findMissingConfig({
        token: 'abc',
        emptyString: '',
        blank: '   ',
        undef: undefined,
        nul: null,
        port: 3306,
        nan: Number.NaN,
        zero: 0,
      })
    ).toEqual(['emptyString', 'blank', 'undef', 'nul', 'nan']);
  });

  it('すべて設定済みなら空配列を返す', () => {
    expect(findMissingConfig({ a: 'x', b: 1 })).toEqual([]);
  });
});

describe('runShutdownSteps', () => {
  it('先頭から順に実行し、失敗しても残りを続ける', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const order: string[] = [];

    const failed = await runShutdownSteps([
      { name: 'http', run: () => void order.push('http') },
      {
        name: 'discord',
        run: async () => {
          order.push('discord');
          throw new Error('fail');
        },
      },
      { name: 'db', run: async () => void order.push('db') },
    ]);

    expect(order).toEqual(['http', 'discord', 'db']);
    expect(failed).toEqual(['discord']);
  });
});
