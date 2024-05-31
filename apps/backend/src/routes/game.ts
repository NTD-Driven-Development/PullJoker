import { Server } from '@packages/socket'
import { container } from 'tsyringe'
// import { GameController } from '~/game/adapter/game-controller'

// import { FastifyInstance, FastifyPluginOptions } from 'fastify'
// export const GameRoutes = (fastify: FastifyInstance, opts: FastifyPluginOptions, done: () => void) => {
// const gameController = container.resolve(GameController)
// fastify.get('/', gameController.getGames)
// done()
// }

// export const GameEventHandlers = (socket: Server) => {
//     const gameController = container.resolve(GameController)
//     socket.on('register-game', async (event) => {
//         await gameController.registerGame(event)
//     })
//     socket.on('update-game-info', async (event) => {
//         await gameController.updateGameInfo(event)
//     })
//     socket.on('get-games', async (event) => {
//         socket.emit('get-games-result', await gameController.getGames(event))
//     })
// }
