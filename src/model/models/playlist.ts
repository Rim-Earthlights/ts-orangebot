import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class Playlist extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id!: string;

    @Column({ type: 'bigint', width: 20, nullable: false })
    user_id!: string;

    @Column({ type: 'varchar', width: 60, nullable: false })
    name!: string;

    @Column({ type: 'varchar', width: 255, nullable: false })
    title!: string;

    @Column({ type: 'varchar', width: 255, nullable: false })
    url!: string;

    @CreateDateColumn({ type: 'datetime', nullable: false })
    createdAt!: Date;
}
