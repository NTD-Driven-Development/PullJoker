import { config } from 'dotenv'
if (process.env.NODE_ENV === 'production') {
    config({ path: __dirname + `/../.env.${process.env.NODE_ENV}` })
} else {
    config({ path: `.env.${process.env.NODE_ENV}` })
}
import { DataSource } from 'typeorm'
import { ClearDatabaseFeatureToggle } from '~/feature-toggle'
import { EventStore } from './entity'

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
    entities: [EventStore],
    subscribers: [],
    migrations: [],
    extra: {
        connectionLimit: 10,
    },
})
