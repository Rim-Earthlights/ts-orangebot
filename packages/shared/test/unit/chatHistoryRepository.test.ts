import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatHistoryRepository } from '../../src/repository/chatHistoryRepository.js';
import { ChatRole } from '../../src/types/chat.js';

const repository = {
  save: vi.fn().mockResolvedValue(undefined),
  findOne: vi.fn(),
  createQueryBuilder: vi.fn(),
  find: vi.fn(),
  softDelete: vi.fn(),
  delete: vi.fn(),
};

vi.mock('../../src/config/datasource.js', () => ({
  getDataSource: () => ({
    getRepository: () => repository,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  repository.save.mockResolvedValue(undefined);
});

describe('ChatHistoryRepository.save', () => {
  it('保存時だけ system ロールのメッセージを除外する', async () => {
    const chatHistoryRepository = new ChatHistoryRepository();
    const content = [
      { role: ChatRole.SYSTEM, content: 'system prompt' },
      { role: ChatRole.USER, content: 'hello' },
      { role: ChatRole.ASSISTANT, content: 'hi' },
    ];

    await chatHistoryRepository.save({ uuid: 'u-1', content });

    expect(repository.save).toHaveBeenCalledWith({
      uuid: 'u-1',
      content: [
        { role: ChatRole.USER, content: 'hello' },
        { role: ChatRole.ASSISTANT, content: 'hi' },
      ],
    });
    expect(content).toEqual([
      { role: ChatRole.SYSTEM, content: 'system prompt' },
      { role: ChatRole.USER, content: 'hello' },
      { role: ChatRole.ASSISTANT, content: 'hi' },
    ]);
  });
});
