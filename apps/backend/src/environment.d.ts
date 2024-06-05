declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test' | 'ci'
            NODE_PORT: string
            NODE_HOST: string
            DB_TYPE: 'mongodb' | 'mariadb' | 'postgres' | 'mssql' | 'redis'
            DB_HOST: string
            DB_PORT: string
            DB_USER: string
            DB_PASSWORD: string
            DB_NAME: string
            AUTH0_DOMAIN: string
            AUTH0_AUDIENCE: string
        }
    }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
