import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryColumn,
    UpdateDateColumn
} from 'typeorm';
import { GachaTable } from './gacha';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class Users extends BaseEntity {
    @PrimaryColumn({ type: 'bigint', width: 20 })
    id!: string;

    @Column({ type: 'varchar', width: 255, nullable: true })
    pref?: string | null;

    @DeleteDateColumn({ type: 'datetime', nullable: true })
    deletedAt?: Date;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updatedAt?: Date;

    @CreateDateColumn({ type: 'datetime', nullable: false })
    createdAt!: Date;

    @OneToMany(() => GachaTable, (g) => g.user_id)
    gacha?: GachaTable[];
}
