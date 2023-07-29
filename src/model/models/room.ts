import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryColumn,
    UpdateDateColumn
} from 'typeorm';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class Room extends BaseEntity {
    @PrimaryColumn({ type: 'bigint', width: 20 })
    room_id!: string;

    @Column({ type: 'bigint', width: 20 })
    guild_id!: string;

    @Column({ type: 'varchar', width: 255 })
    name!: string;

    @Column({ type: 'tinyint', width: 1, default: 1 })
    is_autodelete!: boolean;

    @Column({ type: 'tinyint', width: 1, default: 0 })
    is_live!: boolean;

    @Column({ type: 'tinyint', width: 1, default: 0 })
    is_private!: boolean;

    @DeleteDateColumn({ type: 'datetime', nullable: true })
    deleted_at: Date | null = null;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updated_at: Date | null = null;

    @CreateDateColumn({ type: 'datetime', nullable: false })
    created_at!: Date;
}
