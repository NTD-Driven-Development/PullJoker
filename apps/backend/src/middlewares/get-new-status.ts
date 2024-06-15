import { Server } from '@packages/socket'
import { container } from 'tsyringe'
import { Event } from 'socket.io'
import { GameSocketController } from '~/game/adapter/game-socket-controller'

const GetNewStatusHandler = (socket: Server) => async (event: Event, next: (err?: Error) => void) => {
    const gameController = container.resolve(GameSocketController)
    const status = await gameController.getMyStatus(socket.auth.user)
    socket.emit('get-my-status-result', status)
    if (socket.auth.user.gameId) {
        socket.join(socket.auth.user.gameId)
        //     const gameStatus = await gameController.getGame({ type: 'get-game', data: { gameId: socket.auth.user.gameId } }, socket.auth.user)
        //     socket.to(socket.auth.user.gameId).emit('get-game-result', gameStatus)
        //     socket.emit('get-game-result', gameStatus)
    }
    next()
}

export { GetNewStatusHandler }
