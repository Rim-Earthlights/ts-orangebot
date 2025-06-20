import { ChatCompletionMessageParam } from 'openai/resources';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LiteLLMModel } from '../../config/config.js';
import { LiteLLMMode } from '../../constant/chat/chat.js';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class ChatHistory extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', width: 255 })
  uuid!: string;

  @Column({ type: 'bigint', width: 20 })
  channel_id!: string;

  @Column({ type: 'varchar', width: 20 })
  channel_type!: ChatHistoryChannelType;

  @Column({ type: 'varchar', width: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'json' })
  content!: ChatCompletionMessageParam[];

  @Column({ type: 'varchar', width: 255 })
  model!: LiteLLMModel;

  @Column({ type: 'varchar', width: 255 })
  mode!: LiteLLMMode;

  @CreateDateColumn({ type: 'datetime', nullable: false })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: false })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at: Date | null = null;
}

export enum ChatHistoryChannelType {
  DM = 'dm',
  GUILD = 'guild',
}
