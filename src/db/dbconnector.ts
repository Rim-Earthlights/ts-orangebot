import { Sequelize } from '@sequelize/core';
import { CONFIG } from '../config/config';
import { User } from './models/user';

export class DbConnector {
    static connection = new Sequelize(CONFIG.DB.DATABASE, CONFIG.DB.USERNAME, CONFIG.DB.PASSWORD, {
        host: CONFIG.DB.HOSTNAME,
        // one of our supported dialects:
        // 'mysql', 'mariadb', 'postgres', 'mssql', 'sqlite', 'snowflake', 'db2' or 'ibmi'
        dialect: 'mariadb'
    });
}

function init() {
    DbConnector.connection.define('User', User.User);
}

export function flush(force?: boolean) {
    init();
    DbConnector.connection.models.User.sync({ force: force ? force : false });
}
