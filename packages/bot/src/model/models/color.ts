import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class Color extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'bigint', width: 20 })
  role_id!: string;

  @Column({ type: 'varchar', width: 7 })
  color_code!: string;

  @Column({ type: 'varchar', width: 255 })
  color_name!: string;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at: Date | null = null;

  @UpdateDateColumn({ type: 'datetime', nullable: true })
  updated_at: Date | null = null;

  @CreateDateColumn({ type: 'datetime', nullable: false })
  created_at!: Date;
}
