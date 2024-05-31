import {} from '@packages/domain'
import { Socket as BaseServer } from 'socket.io'
import { Socket as BaseClient } from 'socket.io-client'

interface ServerToClientEvents {
    'validation-error': (error: string) => void
}

interface ClientToServerEvents {}

export type Server = BaseServer<ClientToServerEvents, ServerToClientEvents>
export type Client = BaseClient<ServerToClientEvents, ClientToServerEvents>
