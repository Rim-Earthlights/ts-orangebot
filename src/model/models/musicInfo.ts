import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class MusicInfo extends BaseEntity {
    @PrimaryColumn({ type: 'bigint', width: 20 })
    guild_id!: string;

    @Column({ type: 'tinyint' })
    is_shuffle!: boolean;

    @Column({ type: 'tinyint' })
    is_loop!: boolean;

    @Column({ type: 'smallint' })
    index!: number;

    @CreateDateColumn({ type: 'datetime', nullable: false })
    createdAt!: Date;
}
