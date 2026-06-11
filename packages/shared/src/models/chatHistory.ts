import { ChatCompletionMessageParam } from 'openai/resources';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { BotInfo } from './botInfo.js';

// enum はデコレーターメタデータ (design:type) から参照されるため、クラスより前に宣言する
export enum ChatHistoryChannelType {
  DM = 'dm',
  GUILD = 'guild',
}

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class ChatHistory extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  uuid!: string;

  @Column({ type: 'bigint', width: 20 })
  bot_id!: string;

  @Column({ type: 'bigint', width: 20 })
  channel_id!: string;

  @Column({ type: 'varchar', length: 255 })
  channel_type!: ChatHistoryChannelType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'json' })
  content!: ChatCompletionMessageParam[];

  @Column({ type: 'varchar', length: 255 })
  model!: string;

  @Column({ type: 'varchar', length: 255 })
  mode!: string;

  @CreateDateColumn({ type: 'datetime', nullable: false })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: false })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at: Date | null = null;

  @ManyToOne(() => BotInfo, (botInfo) => botInfo.bot_id)
  @JoinColumn({ name: 'bot_id', referencedColumnName: 'bot_id' })
  bot_info!: Relation<BotInfo>;
}
