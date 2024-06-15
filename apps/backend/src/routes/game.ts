import { Server } from '@packages/socket'
import { container } from 'tsyringe'
import { GameRestController } from '~/game/adapter/game-rest-controller'
import { GameSocketController } from '~/game/adapter/game-socket-controller'
import { Event, Socket } from 'socket.io'

import { FastifyInstance, FastifyPluginOptions } from 'fastify'
export const GameRoutes = (fastify: FastifyInstance, opts: FastifyPluginOptions, done: () => void) => {
    const gameController = container.resolve(GameRestController)
    fastify.post('/startGame', gameController.createRoom.bind(gameController))
    done()
}

export const GameEventHandlers = (socket: Server) => async (event: Event, next: (err?: Error) => void) => {
    container.registerInstance(Socket, socket)
    const gameController = container.resolve(GameSocketController)
    switch (event[0]) {
        case 'join-room':
            await gameController.joinRoom(event[1], socket.auth.user)
            next()
            break
        case 'start-game':
            await gameController.startGame(event[1], socket.auth.user)
            next()
            break
        case 'draw-card':
            await gameController.drawCard(event[1], socket.auth.user)
            next()
            break
        case 'get-my-status':
            const status = await gameController.getMyStatus(socket.auth.user)
            console.log('GameEventHandlers', status)
            socket.emit('get-my-status-result', status)
            next()
            break
        default:
            await gameController.getMyStatus(socket.auth.user).then((status) => {
                console.log('get status', status.data.id)
                socket.emit('get-my-status-result', status)
                next()
            })
            break
    }
}
