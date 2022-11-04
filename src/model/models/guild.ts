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
export class Guild extends BaseEntity {
    @PrimaryColumn({ type: 'bigint', width: 20 })
    id!: string;

    @Column({ type: 'varchar', width: 255 })
    name!: string;

    @Column({ type: 'varchar', width: 255, default: 'ロビー' })
    lobbyName!: string;

    @Column({ type: 'varchar', width: 255, default: '墓' })
    inactiveName!: string;

    @Column({ type: 'varchar', width: 255, nullable: true })
    excludeNames!: string | null;

    @Column({ type: 'tinyint', default: 0 })
    silent!: number;

    @DeleteDateColumn({ type: 'datetime', nullable: true })
    deletedAt!: Date | null;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updatedAt!: Date | null;

    @CreateDateColumn({ type: 'datetime', nullable: false })
    createdAt!: Date;
}
