import { Sequelize } from '@sequelize/core';
import { DataSource } from 'typeorm';
import { CONFIG } from '../config/config';
import { Users } from './models/users';

export class TypeOrm {
    static dataSource = new DataSource({
        type: 'mariadb', // これに応じて設定項目が変わる(TypeScriptの型が変わる)
        host: CONFIG.DB.HOSTNAME,
        username: CONFIG.DB.USERNAME,
        password: CONFIG.DB.PASSWORD, // 環境変数より取得
        port: CONFIG.DB.PORT,
        logging: true, // SQLログ
        database: CONFIG.DB.DATABASE,
        synchronize: true, // DBとのスキーマ同期(開発用)
        dropSchema: false, // スキーマ削除(開発用)
        charset: 'utf8mb4',
        entities: [Users] // 利用するエンティティ。パスでの指定も可能
    });
}
