import { getLogger, LogLevel } from '../types/log.js';

/**
 * 例外を ERROR レベルでログに残す。ログ出力自体が失敗した場合は標準エラーに出す
 * @param event イベント名
 * @param error 発生した例外
 */
export async function logError(event: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  try {
    await getLogger().put({ level: LogLevel.ERROR, event, message: [message] });
  } catch (e) {
    console.error(`[error] ${event}`, message, e);
  }
}

/**
 * イベントハンドラを try/catch で包み、例外が発生してもプロセスを落とさずログに残す
 * @param event ログに出すイベント名
 * @param handler 元のハンドラ
 */
export function withErrorLog<A extends unknown[]>(
  event: string,
  handler: (...args: A) => unknown
): (...args: A) => Promise<void> {
  return async (...args: A) => {
    try {
      await handler(...args);
    } catch (e) {
      await logError(event, e);
    }
  };
}

/**
 * 必須の設定値のうち、未設定 (undefined / null / 空文字 / NaN) のキー名を返す
 * @param entries 設定キー名と値の組
 */
export function findMissingConfig(entries: Record<string, unknown>): string[] {
  return Object.entries(entries)
    .filter(([, value]) => {
      if (value === undefined || value === null) {
        return true;
      }
      if (typeof value === 'string') {
        return value.trim() === '';
      }
      if (typeof value === 'number') {
        return Number.isNaN(value);
      }
      return false;
    })
    .map(([key]) => key);
}

export type ShutdownStep = {
  name: string;
  run: () => unknown;
};

/**
 * 終了処理を順番に実行する。途中で失敗しても残りの処理は続け、失敗した処理名を返す
 * @param steps 終了処理の一覧
 */
export async function runShutdownSteps(steps: ShutdownStep[]): Promise<string[]> {
  const failed: string[] = [];
  for (const step of steps) {
    try {
      await step.run();
    } catch (e) {
      failed.push(step.name);
      console.error(`終了処理に失敗しました (${step.name}):`, e);
    }
  }
  return failed;
}

/**
 * SIGTERM / SIGINT を受けたら終了処理を実行してプロセスを終了する
 * @param steps 終了処理の一覧 (先頭から順に実行する)
 * @param timeoutMs 終了処理が終わらない場合に強制終了するまでの時間
 */
export function registerGracefulShutdown(steps: ShutdownStep[], timeoutMs = 10_000): void {
  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    console.log(`${signal} を受信したため終了処理を行います`);

    const timer = setTimeout(() => {
      console.error('終了処理がタイムアウトしたため強制終了します');
      process.exit(1);
    }, timeoutMs);
    timer.unref();

    const failed = await runShutdownSteps(steps);
    process.exit(failed.length === 0 ? 0 : 1);
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

/**
 * どこにも catch されなかった Promise の reject をログに残す (プロセスは落とさない)
 */
export function registerUnhandledRejectionLogger(): void {
  process.on('unhandledRejection', (reason) => {
    void logError('unhandled-rejection', reason);
  });
}
