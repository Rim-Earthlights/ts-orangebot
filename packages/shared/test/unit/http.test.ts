import { describe, expect, it } from 'vitest';
import { isLanRequest, isLocalRequest } from '../../src/common/http.js';

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

describe('isLanRequest', () => {
  it('ループバック・プライベートアドレスからの直接のリクエストは許可する', () => {
    expect(isLanRequest('127.0.0.1', {})).toBe(true);
    expect(isLanRequest('::1', {})).toBe(true);
    expect(isLanRequest('192.168.0.10', {})).toBe(true);
    expect(isLanRequest('10.1.2.3', {})).toBe(true);
    expect(isLanRequest('172.20.0.1', {})).toBe(true);
    expect(isLanRequest('::ffff:192.168.0.10', {})).toBe(true);
    expect(isLanRequest('fd00::1', {})).toBe(true);
    expect(isLanRequest('fe80::1', {})).toBe(true);
  });

  it('グローバルアドレスからのリクエストは拒否する', () => {
    expect(isLanRequest('203.0.113.1', {})).toBe(false);
    expect(isLanRequest('172.32.0.1', {})).toBe(false);
    expect(isLanRequest('::ffff:203.0.113.1', {})).toBe(false);
    expect(isLanRequest('2001:db8::1', {})).toBe(false);
    expect(isLanRequest(undefined, {})).toBe(false);
  });

  it('リバースプロキシ経由のリクエストは接続元が LAN 内でも拒否する', () => {
    expect(isLanRequest('192.168.0.10', { 'x-forwarded-for': '203.0.113.1' })).toBe(false);
    expect(isLanRequest('127.0.0.1', { forwarded: 'for=203.0.113.1' })).toBe(false);
  });
});
