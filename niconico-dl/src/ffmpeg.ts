import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";
import { FfmpegError } from "./errors.js";
import type { StreamOptions } from "./types.js";

/** ffmpeg 実行ファイルのパスを解決する。 */
export function resolveFfmpegPath(explicit?: string): string {
  if (explicit) return explicit;
  // ffmpeg-static があれば優先。なければ PATH 上の "ffmpeg" を使う。
  try {
    const require = createRequire(import.meta.url);
    const p = require("ffmpeg-static") as string | null;
    if (p) return p;
  } catch {
    // ffmpeg-static 未インストール。フォールバックする。
  }
  return "ffmpeg";
}

const CONTAINER_ARGS: Record<NonNullable<StreamOptions["container"]>, string[]> =
  {
    // パイプ出力で再生可能にするためフラグメント mp4 にする。
    mp4: ["-f", "mp4", "-movflags", "frag_keyframe+empty_moov+default_base_moof"],
    matroska: ["-f", "matroska"],
    mpegts: ["-f", "mpegts"],
  };

export interface FfmpegStreamInput {
  m3u8Url: string;
  cookieHeader: string;
  userAgent: string;
  referer: string;
}

interface SpawnResult {
  /** 多重化された動画の Readable（ffmpeg stdout）。 */
  stream: Readable;
  /** プロセス終了を待つ Promise。非0終了で FfmpegError。 */
  done: Promise<void>;
  /** 明示的に中断する。 */
  kill: () => void;
}

/**
 * ffmpeg を起動し、HLS を取得して指定コンテナにリマックスした
 * Readable ストリームを返す（再エンコードせず -c copy）。
 */
export function spawnFfmpegStream(
  input: FfmpegStreamInput,
  options: StreamOptions = {},
): SpawnResult {
  const container = options.container ?? "mp4";
  const ffmpegPath = resolveFfmpegPath(options.ffmpegPath);

  // HTTP リクエストヘッダ。CRLF 区切りで -headers に渡す。
  const headers =
    [`Cookie: ${input.cookieHeader}`, `Referer: ${input.referer}`].join(
      "\r\n",
    ) + "\r\n";

  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-user_agent",
    input.userAgent,
    "-headers",
    headers,
    "-i",
    input.m3u8Url,
    "-c",
    "copy",
    ...CONTAINER_ARGS[container],
    ...(options.extraArgs ?? []),
    "pipe:1",
  ];

  const child = spawn(ffmpegPath, args, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => {
    // 直近のエラー出力のみ保持（肥大化防止）。
    stderr = (stderr + chunk.toString()).slice(-4000);
  });

  const done = new Promise<void>((resolve, reject) => {
    child.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new FfmpegError(
            `ffmpeg が見つかりません (${ffmpegPath})。ffmpeg-static を入れるか ffmpegPath を指定してください`,
          ),
        );
      } else {
        reject(new FfmpegError(`ffmpeg の起動に失敗: ${err.message}`));
      }
    });
    child.on("close", (code) => {
      if (code === 0 || code === null) resolve();
      else reject(new FfmpegError(`ffmpeg が異常終了しました (code=${code})\n${stderr}`));
    });
  });

  const kill = () => {
    if (!child.killed) child.kill("SIGKILL");
  };

  if (options.signal) {
    if (options.signal.aborted) kill();
    else options.signal.addEventListener("abort", kill, { once: true });
  }

  return { stream: child.stdout, done, kill };
}

/** ストリームをファイルへ書き出すユーティリティ。 */
export async function streamToFile(
  result: SpawnResult,
  destPath: string,
): Promise<void> {
  await Promise.all([
    pipeline(result.stream, createWriteStream(destPath)),
    result.done,
  ]);
}
