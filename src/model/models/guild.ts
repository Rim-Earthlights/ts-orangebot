import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.js';
import { Users } from './users.js';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class Guild extends BaseEntity {
  @PrimaryColumn({ type: 'bigint', width: 20 })
  id!: string;

  @Column({ type: 'varchar', width: 255 })
  name!: string;

  @Column({ type: 'varchar', width: 255, default: 'ロビー' })
  lobby_name!: string;

  @Column({ type: 'varchar', width: 255, default: '墓' })
  inactive_name!: string;

  @Column({ type: 'varchar', width: 255, nullable: true })
  exclude_names: string | null = null;

  @Column({ type: 'tinyint', default: 0 })
  silent!: number;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at: Date | null = null;

  @UpdateDateColumn({ type: 'datetime', nullable: true })
  updated_at: Date | null = null;

  @CreateDateColumn({ type: 'datetime', nullable: false })
  created_at!: Date;

  @OneToMany(() => Users, (user) => user.guild_id)
  users!: Relation<Users>[];

  @OneToMany(() => Role, (role) => role.guild_id)
  roles!: Relation<Role>[];
}
