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
    user_name!: string | null;

    @Column({ type: 'varchar', width: 255, nullable: true })
    pref!: string | null;

    @Column({ type: 'datetime', nullable: true })
    last_pick_date!: Date | null;

    @DeleteDateColumn({ type: 'datetime', nullable: true })
    deleted_at!: Date | null;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updated_at!: Date | null;

    @CreateDateColumn({ type: 'datetime', nullable: false })
    created_at!: Date;

    @OneToMany(() => GachaTable, (g) => g.user_id)
    gacha?: GachaTable[];
}
