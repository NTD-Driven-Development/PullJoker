/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-var-requires */
import 'tsconfig-paths/register'
import { Config } from '@jest/types'

declare global {
    var SOCKET_URL: string
}

export default async function (globalConfig: Config.GlobalConfig, projectConfig: Config.ProjectConfig) {
    if (globalConfig.testPathPattern.includes('/unit')) {
        console.log('is unit test, skip setup server')
        return
    }
    console.log('setup test server')
    await require('../src/index')
}
