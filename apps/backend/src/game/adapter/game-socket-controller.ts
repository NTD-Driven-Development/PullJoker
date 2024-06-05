import { JoinRoomEventSchema, StartGameEventSchema } from '@packages/domain'
import { Server } from '@packages/socket'
import { Socket } from 'socket.io'
import { autoInjectable, inject } from 'tsyringe'
import { SocketThrow } from '~/decorators'
import { AuthUser } from '~/middlewares'
import { JoinRoomUseCase } from '../usecases/join-room-usecase'
import { StartGameUseCase } from '../usecases/start-game-usecase'

@autoInjectable()
export class GameSocketController {
    constructor(
        @inject(Socket)
        private socket: Server,
        @inject(JoinRoomUseCase)
        private joinRoomUseCase: JoinRoomUseCase,
        @inject(StartGameUseCase)
        private startGameUseCase: StartGameUseCase,
    ) {}

    @SocketThrow
    public async joinRoom(event: JoinRoomEventSchema, user: Readonly<AuthUser>) {
        return await this.joinRoomUseCase.execute({ gameId: event.data.gameId, playerId: user.id, playerName: user.name })
    }

    @SocketThrow
    public async startGame(event: StartGameEventSchema, user: Readonly<AuthUser>) {
        return await this.startGameUseCase.execute({ gameId: event.data.gameId, playerId: user.id })
    }
}
