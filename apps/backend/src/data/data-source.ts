import dotenv from 'dotenv'
dotenv.config({ path: `.env.${process.env.NODE_ENV}` })
import { DataSource } from 'typeorm'
import { ClearDatabaseFeatureToggle } from '~/feature-toggle'

export const AppDataSource = new DataSource({
    type: process.env.DB_TYPE as 'mariadb' | 'mongodb' | 'mysql' | 'mssql' | 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    dropSchema: ClearDatabaseFeatureToggle.isEnabled(),
    logging: ['error'],
    entities: [],
    subscribers: [],
    migrations: [],
    extra: {
        connectionLimit: 10,
    },
})
