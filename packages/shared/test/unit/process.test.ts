import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exitOnError,
  findMissingConfig,
  logError,
  runShutdownSteps,
  waitForPendingHandlers,
  withErrorLog,
} from '../../src/common/process.js';
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
    vi.spyOn(console, 'error').mockImplementation(() => {});

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

describe('logError', () => {
  it('ロガーが例外を投げなくても (DB 保存の失敗を握りつぶすロガーでも) 標準エラーにスタックを出す', async () => {
    setLogger({ put: async () => {} });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await logError('event', new Error('boom'));

    expect(console.error).toHaveBeenCalledWith('[error] event', expect.stringContaining('boom'));
  });
});

describe('exitOnError', () => {
  // 終了の保険として仕掛けるタイマーがテスト後に本物の process.exit を呼ばないようにする
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('例外が発生したらログに残してプロセスを終了する', async () => {
    const logs: LogData[] = [];
    setLogger({ put: async (data) => void logs.push(data) });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await exitOnError('ready', async () => {
      throw new Error('boom');
    })();

    expect(logs[0].event).toBe('ready');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('例外が無ければ終了しない', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await exitOnError('ready', async () => {})();
    expect(exit).not.toHaveBeenCalled();
  });
});

describe('waitForPendingHandlers', () => {
  it('実行中のハンドラが終わるまで待つ', async () => {
    let release: () => void = () => {};
    const running = withErrorLog('event', () => new Promise<void>((resolve) => (release = resolve)))();

    setTimeout(() => release(), 20);
    await expect(waitForPendingHandlers(1_000, 5)).resolves.toBe(true);
    await running;
  });

  it('時間内に終わらなければ false を返す', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    let release: () => void = () => {};
    const running = withErrorLog('event', () => new Promise<void>((resolve) => (release = resolve)))();

    await expect(waitForPendingHandlers(20, 5)).resolves.toBe(false);
    release();
    await running;
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

  it('設定テンプレートの仮の値のままなら未設定として扱う', () => {
    expect(
      findMissingConfig({
        token: '******.*********.****-*****-*****',
        appId: '*******************',
        speakToken: 'YOUR_BOT_TOKEN',
        real: 'MTIzNDU2.abc-def',
      })
    ).toEqual(['token', 'appId', 'speakToken']);
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
