import { describe, expect, it } from 'vitest';
import { splitMessage } from '../../src/utils/splitMessage.js';

describe('splitMessage', () => {
  it('上限以内ならそのまま 1 件で返す', () => {
    expect(splitMessage('hello\nworld')).toEqual(['hello\nworld']);
  });

  it('行単位で上限以内にまとめ、行を欠かさない', () => {
    const content = Array.from({ length: 300 }, (_, i) => `line-${i}`.padEnd(20, 'x')).join('\n');
    const chunks = splitMessage(content);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 2000)).toBe(true);
    expect(chunks.join('')).toBe(content);
  });

  it('1 行だけで上限を超える場合は上限ごとに切る', () => {
    const content = 'a'.repeat(4500);
    const chunks = splitMessage(content);
    expect(chunks.map((c) => c.length)).toEqual([2000, 2000, 500]);
    expect(chunks.join('')).toBe(content);
  });

  it('上限を超える行の前後の行も保持する', () => {
    const content = `head\n${'b'.repeat(2500)}\ntail`;
    const chunks = splitMessage(content);
    expect(chunks.every((c) => c.length <= 2000)).toBe(true);
    expect(chunks.join('')).toBe(content);
  });
});
