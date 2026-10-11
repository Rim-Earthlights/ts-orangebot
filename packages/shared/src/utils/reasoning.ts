import { ChatCompletionMessageParam } from 'openai/resources';

/**
 * LiteLLM が assistant メッセージに付ける思考ブロック (Anthropic 形式)
 */
export type ThinkingBlock =
  | { type: 'thinking'; thinking: string; signature?: string }
  | { type: 'redacted_thinking'; data: string };

/**
 * LiteLLM が assistant メッセージに付ける思考関連フィールド (OpenAI SDK の型にはない)
 */
export interface ReasoningFields {
  reasoning_content?: string;
  thinking_blocks?: ThinkingBlock[];
}

/**
 * レスポンスのメッセージから思考関連フィールドだけを取り出す。
 *
 * 履歴に残して /chat/history/:uuid で表示するためのもので、値がないフィールドは含めない。
 */
export function extractReasoning(message: object): ReasoningFields {
  const { reasoning_content, thinking_blocks } = message as ReasoningFields;
  const fields: ReasoningFields = {};
  if (typeof reasoning_content === 'string' && reasoning_content.length > 0) {
    fields.reasoning_content = reasoning_content;
  }
  if (Array.isArray(thinking_blocks) && thinking_blocks.length > 0) {
    fields.thinking_blocks = thinking_blocks;
  }
  return fields;
}

/**
 * LLM へ送るメッセージから思考関連フィールドを取り除く。
 *
 * 履歴には残すが、送り返すとプロバイダによっては不明なフィールドとして拒否されるため、
 * 送信時は従来どおり思考なしのメッセージにする。呼び出し側の配列は変更しない。
 */
export function stripReasoning(content: readonly ChatCompletionMessageParam[]): ChatCompletionMessageParam[] {
  return content.map((message) => {
    if (!('reasoning_content' in message) && !('thinking_blocks' in message)) {
      return message;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { reasoning_content, thinking_blocks, ...rest } = message as ChatCompletionMessageParam & ReasoningFields;
    return rest as ChatCompletionMessageParam;
  });
}
