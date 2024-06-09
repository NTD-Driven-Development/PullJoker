import { Game, UseCase } from '@packages/domain'
import { v4 } from 'node-uuid'
import { autoInjectable, inject } from 'tsyringe'
import { Retry } from '~/decorators'
import { GameRepository, GameRepositoryImpl } from '~/game/repository'

export type CreateRoomInput = null
export type CreateRoomOutput = { gameId: string }

@autoInjectable()
export class CreateRoomUseCase implements UseCase<CreateRoomInput, CreateRoomOutput> {
    constructor(
        @inject(GameRepositoryImpl)
        private gameRepository: GameRepository,
        // @inject(WebSocketEventBus)
        // private eventBus: EventBus,
    ) {}

    @Retry
    async execute(): Promise<CreateRoomOutput> {
        const game = new Game(v4(), 'WAITING')
        await this.gameRepository.save(game, 0)
        // const events = game.getDomainEvents()
        // this.eventBus.broadcast(events)
        return { gameId: game.getId() }
    }
}
