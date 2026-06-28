import { ChatCompletionMessageParam } from 'openai/resources';
import { ChatRole } from '../types/chat.js';

export function isSystemMessage(message: ChatCompletionMessageParam): boolean {
  return message.role === ChatRole.SYSTEM;
}

/**
 * DB に保存する/DB から復元する会話履歴から、システムプロンプトを除外する。
 *
 * セッション上の system メッセージは LLM 呼び出しに必要なため、呼び出し側の配列は変更せず、
 * 永続化対象だけを新しい配列として返す。
 */
export function stripSystemMessages(content: readonly ChatCompletionMessageParam[]): ChatCompletionMessageParam[] {
  return content.filter((message) => !isSystemMessage(message));
}

/**
 * DB には system メッセージがない前提でも、セッション復元時には必要に応じて先頭へ戻す。
 *
 * 旧データのように既に system メッセージが含まれている場合は重複させない。
 */
export function prependSystemMessageIfMissing(
  content: readonly ChatCompletionMessageParam[],
  systemMessage?: ChatCompletionMessageParam
): ChatCompletionMessageParam[] {
  if (!systemMessage || content.some(isSystemMessage)) {
    return [...content];
  }
  return [systemMessage, ...content];
}

export function countNonSystemMessages(content: readonly ChatCompletionMessageParam[]): number {
  return stripSystemMessages(content).length;
}
