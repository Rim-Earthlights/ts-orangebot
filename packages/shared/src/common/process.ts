import { getLogger, LogLevel } from '../types/log.js';

/**
 * 例外を標準エラーに出し、ERROR レベルでログにも残す
 * (各アプリの Logger は DB への保存に失敗しても例外を投げないため、DB が落ちていても原因が残るよう先に標準エラーへ出す)
 * @param event イベント名
 * @param error 発生した例外
 */
export async function logError(event: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  console.error(`[error] ${event}`, message);
  try {
    await getLogger().put({ level: LogLevel.ERROR, event, message: [message] });
  } catch (e) {
    console.error(`[error] ${event} のログ出力に失敗しました`, e);
  }
}

/**
 * 例外をログに残してからプロセスを終了する
 * (DB が応答しないなどでログ出力が終わらなくても、一定時間後には必ず終了する)
 * @param event イベント名
 * @param error 発生した例外
 */
export async function logErrorAndExit(event: string, error: unknown): Promise<void> {
  setTimeout(() => process.exit(1), 5_000).unref();
  await logError(event, error);
  process.exit(1);
}

// withErrorLog で包んだハンドラのうち、実行中のものの数 (終了処理で完了を待つために使う)
let pendingHandlers = 0;
// false になったら withErrorLog で包んだハンドラは新しく実行しない (終了処理中に新しい処理を始めないため)
let acceptingHandlers = true;

/**
 * withErrorLog で包んだハンドラを以後実行しないようにする (終了処理の最初に呼ぶ)
 * Discord クライアントなどを止める前に新しい処理の受け付けだけを止め、実行中のハンドラが最後まで動けるようにする
 */
export function stopAcceptingHandlers(): void {
  acceptingHandlers = false;
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
    if (!acceptingHandlers) {
      return;
    }
    pendingHandlers++;
    try {
      await handler(...args);
    } catch (e) {
      await logError(event, e);
    } finally {
      pendingHandlers--;
    }
  };
}

/**
 * withErrorLog で包んだ実行中のハンドラが終わるまで待つ。時間内に終わらなければ待つのをやめる
 * @param timeoutMs 待つ時間の上限
 * @param intervalMs 確認する間隔
 * @returns 時間内にすべて終わったら true
 */
export async function waitForPendingHandlers(timeoutMs: number, intervalMs = 50): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (pendingHandlers > 0) {
    if (Date.now() >= deadline) {
      console.warn(`実行中のハンドラが ${timeoutMs}ms 以内に終わりませんでした (残り ${pendingHandlers} 件)`);
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return true;
}

/**
 * 起動に欠かせない処理を包み、例外が発生したらログに残してプロセスを終了する
 * (中途半端に初期化されたまま動き続けないようにし、プロセス管理側の再起動に任せる)
 * @param event ログに出すイベント名
 * @param handler 元のハンドラ
 */
export function exitOnError<A extends unknown[]>(
  event: string,
  handler: (...args: A) => unknown
): (...args: A) => Promise<void> {
  return async (...args: A) => {
    try {
      await handler(...args);
    } catch (e) {
      await logErrorAndExit(event, e);
    }
  };
}

// 設定テンプレートの仮の値 ('*****' や 'YOUR_BOT_TOKEN' など)
const PLACEHOLDER_PATTERNS = [/^[*.-]+$/, /^YOUR_/];

/**
 * 必須の設定値のうち、未設定 (undefined / null / 空文字 / NaN) またはテンプレートの仮の値のままのキー名を返す
 * @param entries 設定キー名と値の組
 */
export function findMissingConfig(entries: Record<string, unknown>): string[] {
  return Object.entries(entries)
    .filter(([, value]) => {
      if (value === undefined || value === null) {
        return true;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' || PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
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
  // once ではなく on にする。systemd (KillMode=control-group) や端末の Ctrl+C はプロセスグループ全体に
  // シグナルを送るため、pnpm 経由で起動すると pnpm からの転送分と合わせて同じシグナルが 2 回届く。
  // once だと 2 回目で既定の動作 (即時終了) になり、終了処理が途中で打ち切られる
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

/**
 * どこにも catch されなかった Promise の reject をログに残してからプロセスを終了する
 * (Node.js の既定の動作と同じく終了させ、状態が壊れたまま動き続けないようにする)
 */
export function registerUnhandledRejectionHandler(): void {
  process.on('unhandledRejection', (reason) => logErrorAndExit('unhandled-rejection', reason));
}
