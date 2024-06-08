import { DrawCardEventSchema, GetGameEventSchema, JoinRoomEventSchema, StartGameEventSchema } from '@packages/domain'
import { Server } from '@packages/socket'
import { Socket } from 'socket.io'
import { autoInjectable, inject } from 'tsyringe'
import { SocketThrow } from '~/decorators'
import { AuthUser } from '~/middlewares'
import { JoinRoomUseCase } from '../usecases/join-room-usecase'
import { StartGameUseCase } from '../usecases/start-game-usecase'
import { DrawCardUseCase } from '../usecases/draw-card-usecase'
import { GetGameUseCase } from '../usecases/get-game-usecase'

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
        @inject(GetGameUseCase)
        private getGameUseCase: GetGameUseCase,
    ) {}

    @SocketThrow
    public async getGame(event: GetGameEventSchema, user: Readonly<AuthUser>) {
        const reuslt = await this.getGameUseCase.execute({ gameId: event.data.gameId, userId: user.id })
        return {
            type: reuslt.type as 'get-game-result',
            data: reuslt.data,
        }
    }

    @SocketThrow
    public async getMyStatus(user: Readonly<AuthUser>) {
        return {
            type: 'get-my-status-result' as const,
            data: {
                id: user.id,
                name: user.name,
            },
        }
    }

    @SocketThrow
    public async joinRoom(event: JoinRoomEventSchema, user: Readonly<AuthUser>) {
        this.socket.join(event.data.gameId)
        this.socket.auth = {
            user: {
                id: user.id,
                name: user.name,
                gameId: event.data.gameId,
            },
        }
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
