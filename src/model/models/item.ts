import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm';
import { GachaTable } from './gacha';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class ItemTable extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id!: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    rare!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description?: string;

    @Column({ type: 'tinyint', default: 0, nullable: false })
    is_present!: number;

    @DeleteDateColumn({ type: 'datetime', nullable: true })
    deleted_at?: Date;

    @CreateDateColumn({ type: 'datetime', nullable: false })
    created_at!: Date;

    @OneToMany(() => GachaTable, (g) => g.item_id)
    gacha?: GachaTable[];
}
