import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { ChatHistoryChannelType } from '../models/chatHistory.js';
import { ModelType } from '../models/userSetting.js';
import { ChatHistoryRepository } from '../repository/chatHistoryRepository.js';
import { UsersRepository } from '../repository/usersRepository.js';
import {
  ChatHistorySaveRequest,
  ChatLLMConfig,
  ChatRole,
  ChatSession,
  LiteLLMMode,
} from '../types/chat.js';

/** ユニットテストでリポジトリをモックできるよう、利用メソッドのみを依存として宣言する */
type UsersRepositoryLike = Pick<UsersRepository, 'getUserSetting'>;
type ChatHistoryRepositoryLike = Pick<ChatHistoryRepository, 'save'>;

/**
 * チャットセッション管理サービス (Discord 非依存)
 *
 * セッションはプロセス内で共有されるため static に保持する。
 */
export class ChatService {
  /** チャンネル/ギルド単位の会話セッション一覧 */
  static sessions: ChatSession[] = [];

  constructor(
    private readonly config: ChatLLMConfig,
    private readonly usersRepository: UsersRepositoryLike = new UsersRepository(),
    private readonly chatHistoryRepository: ChatHistoryRepositoryLike = new ChatHistoryRepository()
  ) {}

  private createClient(): OpenAI {
    return new OpenAI({
      organization: this.config.organization,
      project: this.config.project,
      apiKey: this.config.apiKey,
      maxRetries: 3,
      baseURL: this.config.baseURL,
    });
  }

  /**
   * セッションを取得する
   */
  getSession(id: string): ChatSession | undefined {
    return ChatService.sessions.find((c) => c.id === id);
  }

  /**
   * UUID からセッションを取得する
   */
  getSessionByUuid(uuid: string): ChatSession | undefined {
    return ChatService.sessions.find((c) => c.uuid === uuid);
  }

  /**
   * セッションを新規作成する
   */
  createSession(id: string, model: string, mode: LiteLLMMode, isGuild: boolean): ChatSession {
    const session: ChatSession = {
      id,
      uuid: crypto.randomUUID(),
      client: this.createClient(),
      model,
      chat: [],
      isGuild,
      memory: false,
      timestamp: new Date(),
    };
    if (mode === LiteLLMMode.DEFAULT && this.config.systemTemplate) {
      session.chat.push({
        role: ChatRole.SYSTEM,
        content: this.config.systemTemplate,
      });
    }
    ChatService.sessions.push(session);
    return session;
  }

  /**
   * セッションを取得し、なければ作成する
   */
  getOrCreateSession(id: string, model: string, mode: LiteLLMMode, isGuild: boolean): ChatSession {
    return this.getSession(id) ?? this.createSession(id, model, mode, isGuild);
  }

  /**
   * DB に保存された履歴からセッションを復元する
   */
  restoreSession(
    id: string,
    history: { uuid: string; chat: ChatCompletionMessageParam[]; model: string; mode: string },
    isGuild: boolean
  ): ChatSession {
    const session = this.createSession(id, history.model, history.mode as LiteLLMMode, isGuild);
    session.chat = history.chat;
    session.uuid = history.uuid;
    return session;
  }

  /**
   * セッションを削除する
   * @returns 削除したセッション。存在しない場合は null
   */
  deleteSession(id: string): ChatSession | null {
    const session = this.getSession(id);
    if (!session) {
      return null;
    }
    ChatService.sessions = ChatService.sessions.filter((c) => c.id !== id);
    return session;
  }

  /**
   * メモリ機能 (自動削除の抑止) を切り替える
   * @returns 切替後の状態。セッションがない場合は null
   */
  toggleMemory(id: string): boolean | null {
    const session = this.getSession(id);
    if (!session) {
      return null;
    }
    session.memory = !session.memory;
    return session.memory;
  }

  /**
   * セッションの最終利用時刻を更新する
   */
  touchSession(id: string): void {
    const session = this.getSession(id);
    if (session) {
      session.timestamp = new Date();
    }
  }

  /**
   * 一定時間利用されていないセッションを削除する (memory 有効のものは除く)
   * @param idleMs アイドル許容時間 (ミリ秒)
   * @returns 削除したセッション一覧
   */
  pruneIdleSessions(idleMs: number, now: Date = new Date()): ChatSession[] {
    const expired = ChatService.sessions.filter(
      (c) => !c.memory && now.getTime() - c.timestamp.getTime() > idleMs
    );
    if (expired.length > 0) {
      ChatService.sessions = ChatService.sessions.filter((c) => !expired.includes(c));
    }
    return expired;
  }

  /**
   * ユーザー設定 (ModelType) から使用モデル名を解決する
   */
  async resolveUserModel(userId: string): Promise<string> {
    const userSetting = await this.usersRepository.getUserSetting(userId);
    const modelType = userSetting?.model_type ?? ModelType.DEFAULT;

    switch (modelType) {
      case ModelType.DEFAULT:
        return this.config.models.default;
      case ModelType.LOW:
        return this.config.models.low;
      case ModelType.HIGH:
        return this.config.models.high;
      default:
        return this.config.models.default;
    }
  }

  /**
   * ModelType からモデル名を解決する
   */
  resolveModelByType(modelType: (typeof ModelType)[keyof typeof ModelType]): string | null {
    switch (modelType) {
      case ModelType.DEFAULT:
        return this.config.models.default;
      case ModelType.LOW:
        return this.config.models.low;
      case ModelType.HIGH:
        return this.config.models.high;
      default:
        return null;
    }
  }

  /**
   * 会話履歴を DB に保存する
   */
  async saveHistory(request: ChatHistorySaveRequest): Promise<void> {
    await this.chatHistoryRepository.save({
      uuid: request.uuid,
      bot_id: request.botId,
      channel_id: request.channelId,
      name: request.name,
      content: request.content,
      model: request.model,
      mode: request.mode,
      channel_type: request.isGuild ? ChatHistoryChannelType.GUILD : ChatHistoryChannelType.DM,
    });
  }
}
