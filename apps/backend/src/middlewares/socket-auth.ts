import { Server } from '@packages/socket'
import { config } from 'dotenv'
config()

export interface AuthUser {
    id: string
    name: string
}

declare module 'socket.io' {
    interface Socket {
        auth: {
            user: Readonly<AuthUser>
        }
    }
}

type SocketIOMiddlewareFactory = (domain?: string, audience?: string) => (socket: Server, next: (err?: Error) => void) => void

export const authMiddleware: SocketIOMiddlewareFactory = (domainParam?: string, audienceParam?: string) => {
    return async function (socket, next) {
        const { playerId, playerName } = socket.handshake.query
        const { id, name } = socket.handshake.auth
        const player = {
            id: playerId ?? id,
            name: playerName ?? name,
        }

        if (typeof player.id !== 'string' || typeof player.name !== 'string') {
            return next(
                new Error(
                    'No Authorization handshake information found, query{"playerId": "[id]", "playerName": "[name]" } }); https://socket.io/docs/v3/middlewares/#sending-credentials ',
                ),
            )
        }
        socket.auth = { user: player }
        return next()
    }
}
