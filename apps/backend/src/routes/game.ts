import { Server } from '@packages/socket'
import { container } from 'tsyringe'
import { GameRestController } from '~/game/adapter/game-rest-controller'
import { GameSocketController } from '~/game/adapter/game-socket-controller'

import { FastifyInstance, FastifyPluginOptions } from 'fastify'
export const GameRoutes = (fastify: FastifyInstance, opts: FastifyPluginOptions, done: () => void) => {
    const gameController = container.resolve(GameRestController)
    fastify.post('/startGame', gameController.createRoom.bind(gameController))
    done()
}

export const GameEventHandlers = (socket: Server) => {
    const gameController = container.resolve(GameSocketController)

    socket.on('join-room', async (event) => {
        await gameController.joinRoom(event, socket.auth.user)
    })

    socket.on('start-game', async (event) => {
        await gameController.startGame(event, socket.auth.user)
    })
}
