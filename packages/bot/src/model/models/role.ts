import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Guild } from './guild.js';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'bigint', width: 20 })
  guild_id!: string;

  @Column({ type: 'bigint', width: 20 })
  role_id!: string;

  @Column({ type: 'varchar', width: 255 })
  type!: RoleType;

  @Column({ type: 'varchar', width: 255 })
  name!: string;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at: Date | null = null;

  @UpdateDateColumn({ type: 'datetime', nullable: true })
  updated_at: Date | null = null;

  @CreateDateColumn({ type: 'datetime', nullable: false })
  created_at!: Date;

  @ManyToOne(() => Guild, (guild) => guild.id)
  @JoinColumn({ name: 'guild_id', referencedColumnName: 'id' })
  guild!: Relation<Guild>;
}

export enum RoleType {
  GAME = 'game',
  USER = 'user',
  BOT = 'bot',
  ADMIN = 'admin',
}
