import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

/**
 * LLM 呼び出しモード
 */
export enum LiteLLMMode {
  DEFAULT = 'default',
  NOPROMPT = 'no_prompt',
}

/**
 * チャットメッセージのロール
 */
export enum ChatRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

/**
 * チャットセッション (チャンネル/ギルド単位の会話状態)
 */
export type ChatSession = {
  id: string;
  uuid: string;
  client: OpenAI;
  model: string;
  chat: ChatCompletionMessageParam[];
  isGuild: boolean;
  memory: boolean;
  timestamp: Date;
};

/**
 * LLM 接続設定 (利用側パッケージの config から注入する)
 */
export interface ChatLLMConfig {
  apiKey: string;
  organization?: string;
  project?: string;
  baseURL?: string;
  /** LiteLLMMode.DEFAULT のセッション先頭に積むシステムプロンプト */
  systemTemplate?: string;
  /** ModelType (default/low/high) に対応するモデル名 */
  models: { default: string; low: string; high: string };
}

/**
 * チャット履歴保存のリクエスト
 */
export interface ChatHistorySaveRequest {
  uuid: string;
  botId?: string;
  channelId: string;
  name?: string | null;
  content: ChatCompletionMessageParam[];
  model: string;
  mode: string;
  isGuild: boolean;
}
