import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class Timer extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'bigint', width: 20 })
    guild_id!: string;

    @Column({ type: 'bigint', width: 20 })
    user_id!: string;

    @Column({ type: 'bigint', width: 20 })
    channel_id!: string;

    @Column({ type: 'datetime', nullable: false })
    timer_date!: Date;

    @Column({ type: 'varchar', length: 30, nullable: true })
    description!: string;

    @CreateDateColumn({ type: 'datetime', nullable: false })
    created_at!: Date;

    @UpdateDateColumn({ type: 'datetime', nullable: false })
    updated_at!: Date;
}
