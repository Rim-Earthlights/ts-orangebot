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
}

export type RoleType = 'game' | 'user' | 'bot' | 'admin';
