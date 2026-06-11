import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatHistoryChannelType } from '../../src/models/chatHistory.js';
import { ModelType } from '../../src/models/userSetting.js';
import { ChatService } from '../../src/services/chat.service.js';
import { ChatLLMConfig, ChatRole, LiteLLMMode } from '../../src/types/chat.js';

const CONFIG: ChatLLMConfig = {
  apiKey: 'test-key',
  baseURL: 'http://localhost:4000',
  systemTemplate: 'system prompt',
  models: { default: 'model-default', low: 'model-low', high: 'model-high' },
};

function makeService(overrides: { userSetting?: unknown; saveSpy?: ReturnType<typeof vi.fn> } = {}) {
  const usersRepository = {
    getUserSetting: vi.fn().mockResolvedValue(overrides.userSetting ?? null),
  };
  const chatHistoryRepository = {
    save: overrides.saveSpy ?? vi.fn().mockResolvedValue(undefined),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new ChatService(CONFIG, usersRepository as any, chatHistoryRepository as any);
  return { service, usersRepository, chatHistoryRepository };
}

afterEach(() => {
  ChatService.sessions = [];
  vi.restoreAllMocks();
});

describe('ChatService セッション管理', () => {
  it('createSession は DEFAULT モードでシステムプロンプトを積む', () => {
    const { service } = makeService();
    const session = service.createSession('100', 'model-default', LiteLLMMode.DEFAULT, true);
    expect(session.chat).toEqual([{ role: ChatRole.SYSTEM, content: 'system prompt' }]);
    expect(session.uuid).toBeTruthy();
    expect(ChatService.sessions).toHaveLength(1);
  });

  it('createSession は NOPROMPT モードでは空のまま', () => {
    const { service } = makeService();
    const session = service.createSession('100', 'model-default', LiteLLMMode.NOPROMPT, true);
    expect(session.chat).toEqual([]);
  });

  it('getOrCreateSession は既存セッションを再利用する', () => {
    const { service } = makeService();
    const first = service.getOrCreateSession('100', 'model-default', LiteLLMMode.DEFAULT, true);
    const second = service.getOrCreateSession('100', 'model-low', LiteLLMMode.DEFAULT, true);
    expect(second).toBe(first);
    expect(ChatService.sessions).toHaveLength(1);
  });

  it('deleteSession はセッションを削除して返す', () => {
    const { service } = makeService();
    service.createSession('100', 'model-default', LiteLLMMode.DEFAULT, true);
    const deleted = service.deleteSession('100');
    expect(deleted?.id).toBe('100');
    expect(ChatService.sessions).toHaveLength(0);
    expect(service.deleteSession('100')).toBeNull();
  });

  it('restoreSession は履歴からセッションを復元する', () => {
    const { service } = makeService();
    const chat = [{ role: 'user' as const, content: 'hello' }];
    const session = service.restoreSession(
      '100',
      { uuid: 'restored-uuid', chat, model: 'model-low', mode: 'default' },
      true
    );
    expect(session.uuid).toBe('restored-uuid');
    expect(session.chat).toBe(chat);
    expect(session.model).toBe('model-low');
    expect(service.getSessionByUuid('restored-uuid')).toBe(session);
  });

  it('toggleMemory はセッションがなければ null', () => {
    const { service } = makeService();
    expect(service.toggleMemory('100')).toBeNull();
    service.createSession('100', 'model-default', LiteLLMMode.DEFAULT, true);
    expect(service.toggleMemory('100')).toBe(true);
    expect(service.toggleMemory('100')).toBe(false);
  });

  it('pruneIdleSessions は期限切れの非 memory セッションのみ削除する', () => {
    const { service } = makeService();
    const now = new Date('2026-06-11T12:00:00');
    const old = new Date('2026-06-11T10:00:00');

    const expired = service.createSession('expired', 'm', LiteLLMMode.DEFAULT, true);
    expired.timestamp = old;
    const kept = service.createSession('kept-memory', 'm', LiteLLMMode.DEFAULT, true);
    kept.timestamp = old;
    kept.memory = true;
    const fresh = service.createSession('fresh', 'm', LiteLLMMode.DEFAULT, false);
    fresh.timestamp = now;

    const removed = service.pruneIdleSessions(60 * 60 * 1000, now);
    expect(removed.map((s) => s.id)).toEqual(['expired']);
    expect(ChatService.sessions.map((s) => s.id).sort()).toEqual(['fresh', 'kept-memory']);
  });

  it('touchSession は最終利用時刻を更新する', () => {
    const { service } = makeService();
    const session = service.createSession('100', 'm', LiteLLMMode.DEFAULT, true);
    session.timestamp = new Date('2026-01-01T00:00:00');
    service.touchSession('100');
    expect(session.timestamp.getTime()).toBeGreaterThan(new Date('2026-01-01T00:00:00').getTime());
  });
});

describe('ChatService モデル解決', () => {
  it('resolveUserModel はユーザー設定の ModelType を反映する', async () => {
    const { service } = makeService({ userSetting: { model_type: ModelType.HIGH } });
    expect(await service.resolveUserModel('1')).toBe('model-high');
  });

  it('resolveUserModel は設定がなければ default', async () => {
    const { service } = makeService();
    expect(await service.resolveUserModel('1')).toBe('model-default');
  });

  it('resolveModelByType は不明な値で null', () => {
    const { service } = makeService();
    expect(service.resolveModelByType(ModelType.LOW)).toBe('model-low');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(service.resolveModelByType('unknown' as any)).toBeNull();
  });
});

describe('ChatService.saveHistory', () => {
  it('isGuild に応じて channel_type を変換して保存する', async () => {
    const saveSpy = vi.fn().mockResolvedValue(undefined);
    const { service } = makeService({ saveSpy });
    await service.saveHistory({
      uuid: 'u-1',
      botId: 'bot-1',
      channelId: '100',
      name: 'guild-name',
      content: [],
      model: 'model-default',
      mode: 'default',
      isGuild: true,
    });
    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: 'u-1',
        bot_id: 'bot-1',
        channel_id: '100',
        channel_type: ChatHistoryChannelType.GUILD,
      })
    );

    await service.saveHistory({
      uuid: 'u-2',
      channelId: '200',
      content: [],
      model: 'model-default',
      mode: 'default',
      isGuild: false,
    });
    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ uuid: 'u-2', channel_type: ChatHistoryChannelType.DM })
    );
  });
});
