import { DataTypes } from '@sequelize/core';

export const User = {
    User: {
        userId: {
            type: DataTypes.BIGINT,
            primaryKey: true
        },
        pref: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }
};
