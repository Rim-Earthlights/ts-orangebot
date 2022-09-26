import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { Users } from './users';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class GachaTable extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: string;

    @Column({ type: 'bigint', width: 20 })
    user_id!: string;

    @Column({ type: 'datetime', nullable: false })
    gachaTime!: Date;

    @Column({ type: 'varchar', width: 255, nullable: false })
    rare!: string;

    @Column({ type: 'tinyint', nullable: false })
    rank!: number;

    @Column({ type: 'varchar', width: 255, nullable: false })
    description!: string;

    @DeleteDateColumn({ type: 'datetime', nullable: true })
    deletedAt?: Date;

    @CreateDateColumn({ type: 'datetime', nullable: false })
    createdAt!: Date;

    @ManyToOne(() => Users, (user) => user.id)
    @JoinColumn({ name: 'user_id' })
    users!: Users;
}
