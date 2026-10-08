import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startTyping } from '../../src/utils/typing.js';

describe('startTyping', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('開始時に即送信し、8秒ごとに再送する', () => {
    const channel = { sendTyping: vi.fn().mockResolvedValue(undefined) };
    const typing = startTyping(channel);
    expect(channel.sendTyping).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(8000);
    expect(channel.sendTyping).toHaveBeenCalledTimes(2);

    typing.stop();
    vi.advanceTimersByTime(16000);
    expect(channel.sendTyping).toHaveBeenCalledTimes(2);
  });

  it('refresh で即座に再送する', () => {
    const channel = { sendTyping: vi.fn().mockResolvedValue(undefined) };
    const typing = startTyping(channel);
    typing.refresh();
    expect(channel.sendTyping).toHaveBeenCalledTimes(2);
    typing.stop();
  });

  it('sendTyping の失敗を握りつぶす', async () => {
    const channel = { sendTyping: vi.fn().mockRejectedValue(new Error('forbidden')) };
    const typing = startTyping(channel);
    await vi.runOnlyPendingTimersAsync();
    typing.stop();
  });

  it('channel が null でもエラーにならない', () => {
    const typing = startTyping(null);
    vi.advanceTimersByTime(8000);
    typing.stop();
  });
});
