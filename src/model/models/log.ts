import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class Log extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id!: number;

    @Column({ type: 'bigint', width: 20, nullable: true })
    guild_id: string | null = null;

    @Column({ type: 'bigint', width: 20, nullable: true })
    channel_id: string | null = null;

    @Column({ type: 'bigint', width: 20, nullable: true })
    user_id: string | null = null;

    @Column({ type: 'varchar', width: 255, nullable: false })
    level!: 'info' | 'error' | 'system';

    @Column({ type: 'varchar', width: 255, nullable: false })
    event!: string;

    @Column({ type: 'varchar', width: 255, nullable: true })
    message: string | null = null;

    @DeleteDateColumn({ type: 'datetime', nullable: true })
    deleted_at: Date | null = null;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updated_at: Date | null = null;

    @CreateDateColumn({ type: 'datetime', nullable: false })
    created_at!: Date;
}
