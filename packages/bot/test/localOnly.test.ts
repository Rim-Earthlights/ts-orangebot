import { describe, expect, it } from 'vitest';
import { isLocalRequest } from '../src/controller/middleware/localOnly.js';

describe('isLocalRequest', () => {
  it('ループバックアドレスからの直接のリクエストは許可する', () => {
    expect(isLocalRequest('127.0.0.1', {})).toBe(true);
    expect(isLocalRequest('::1', {})).toBe(true);
    expect(isLocalRequest('::ffff:127.0.0.1', {})).toBe(true);
  });

  it('外部アドレスからのリクエストは拒否する', () => {
    expect(isLocalRequest('192.168.0.10', {})).toBe(false);
    expect(isLocalRequest('203.0.113.1', {})).toBe(false);
    expect(isLocalRequest(undefined, {})).toBe(false);
  });

  it('リバースプロキシ経由のリクエストは接続元がループバックでも拒否する', () => {
    expect(isLocalRequest('127.0.0.1', { 'x-forwarded-for': '203.0.113.1' })).toBe(false);
    expect(isLocalRequest('127.0.0.1', { 'x-real-ip': '203.0.113.1' })).toBe(false);
    expect(isLocalRequest('127.0.0.1', { forwarded: 'for=203.0.113.1' })).toBe(false);
  });
});
