/** ニコニコ関連の処理で発生する基底エラー。 */
export class NiconicoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NiconicoError";
  }
}

/** ログインが必要、またはセッションが無効な場合。 */
export class LoginRequiredError extends NiconicoError {
  constructor(message = "ログインが必要です（会員限定・年齢制限・PPV など）") {
    super(message);
    this.name = "LoginRequiredError";
  }
}

/** 動画が取得不可（削除・非公開・地域制限など）。 */
export class VideoUnavailableError extends NiconicoError {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly reasonCode?: string,
  ) {
    super(message);
    this.name = "VideoUnavailableError";
  }
}

/** ffmpeg の実行に失敗した場合。 */
export class FfmpegError extends NiconicoError {
  constructor(message: string) {
    super(message);
    this.name = "FfmpegError";
  }
}
