import { describe, expect, it } from 'vitest';
import { ChatCompletionMessageParam } from 'openai/resources';
import { extractReasoning, stripReasoning } from '../../src/utils/reasoning.js';

describe('extractReasoning', () => {
  it('reasoning_content と thinking_blocks を取り出す', () => {
    const blocks = [{ type: 'thinking' as const, thinking: '考え中', signature: 'sig' }];
    const fields = extractReasoning({
      role: 'assistant',
      content: '答え',
      reasoning_content: '考え中',
      thinking_blocks: blocks,
    });
    expect(fields).toEqual({ reasoning_content: '考え中', thinking_blocks: blocks });
  });

  it('思考がない場合は空オブジェクトを返す', () => {
    expect(extractReasoning({ role: 'assistant', content: '答え' })).toEqual({});
    expect(extractReasoning({ role: 'assistant', content: '答え', reasoning_content: '', thinking_blocks: [] })).toEqual(
      {}
    );
  });
});

describe('stripReasoning', () => {
  it('思考関連フィールドを除き、元の配列は変更しない', () => {
    const content = [
      { role: 'user', content: '質問' },
      { role: 'assistant', content: '答え', reasoning_content: '考え中', thinking_blocks: [] },
    ] as ChatCompletionMessageParam[];

    const stripped = stripReasoning(content);

    expect(stripped).toEqual([
      { role: 'user', content: '質問' },
      { role: 'assistant', content: '答え' },
    ]);
    expect(content[1]).toHaveProperty('reasoning_content', '考え中');
  });

  it('思考がないメッセージは同じ参照を返す', () => {
    const message: ChatCompletionMessageParam = { role: 'user', content: '質問' };
    expect(stripReasoning([message])[0]).toBe(message);
  });
});
