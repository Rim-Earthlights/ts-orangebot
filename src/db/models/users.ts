import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class Users {
    @PrimaryColumn({ type: 'bigint', width: 20 })
    userId!: string;

    @Column({ type: 'varchar', width: 255, nullable: true })
    pref?: string | null;

    @Column({ type: 'datetime', nullable: true })
    deletedAt?: Date;

    @Column({ type: 'datetime', nullable: true })
    updatedAt?: Date;

    @Column({ type: 'datetime', nullable: true })
    createdAt!: Date;
}
