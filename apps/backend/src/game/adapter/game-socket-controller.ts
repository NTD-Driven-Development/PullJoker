import { DrawCardEventSchema, JoinRoomEventSchema, StartGameEventSchema } from '@packages/domain'
import { Server } from '@packages/socket'
import { Socket } from 'socket.io'
import { autoInjectable, inject } from 'tsyringe'
import { SocketThrow } from '~/decorators'
import { AuthUser } from '~/middlewares'
import { JoinRoomUseCase } from '../usecases/join-room-usecase'
import { StartGameUseCase } from '../usecases/start-game-usecase'
import { DrawCardUseCase } from '../usecases/draw-card-usecase'

@autoInjectable()
export class GameSocketController {
    constructor(
        @inject(Socket)
        private socket: Server,
        @inject(JoinRoomUseCase)
        private joinRoomUseCase: JoinRoomUseCase,
        @inject(StartGameUseCase)
        private startGameUseCase: StartGameUseCase,
        @inject(DrawCardUseCase)
        private drawCardUseCase: DrawCardUseCase,
    ) {}

    @SocketThrow
    public async joinRoom(event: JoinRoomEventSchema, user: Readonly<AuthUser>) {
        return await this.joinRoomUseCase.execute({ gameId: event.data.gameId, playerId: user.id, playerName: user.name })
    }

    @SocketThrow
    public async startGame(event: StartGameEventSchema, user: Readonly<AuthUser>) {
        return await this.startGameUseCase.execute({ gameId: event.data.gameId, playerId: user.id })
    }

    @SocketThrow
    public async drawCard(event: DrawCardEventSchema, user: Readonly<AuthUser>) {
        return await this.drawCardUseCase.execute({
            gameId: event.data.gameId,
            fromPlayerId: event.data.fromPlayerId,
            toPlayerId: user.id,
            cardIndex: event.data.cardIndex,
        })
    }
}
