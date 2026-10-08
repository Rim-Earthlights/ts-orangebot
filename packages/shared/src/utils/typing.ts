/**
 * 入力中表示を送れるチャンネル
 * discord.js に依存しないよう、sendTyping を持つものとして受け取る
 */
export interface TypingChannel {
  sendTyping(): Promise<unknown>;
}

export interface TypingIndicator {
  /** 入力中表示を即座に再送する (メッセージ送信で表示が消えた直後など) */
  refresh(): void;
  /** 入力中表示の再送を停止する */
  stop(): void;
}

/** Discord の入力中表示は約10秒で消えるため、それより短い間隔で再送する */
const TYPING_INTERVAL_MS = 8000;

/**
 * 「(bot名)が入力中...」を表示し続ける
 * Discord の入力中表示は約10秒またはメッセージ送信で消えるため、定期的に再送する
 * @param channel 送信先チャンネル。null の場合は何もしない
 */
export function startTyping(channel: TypingChannel | null): TypingIndicator {
  const send = () => {
    channel?.sendTyping().catch(() => undefined);
  };
  send();
  const timer = setInterval(send, TYPING_INTERVAL_MS);
  return { refresh: send, stop: () => clearInterval(timer) };
}
