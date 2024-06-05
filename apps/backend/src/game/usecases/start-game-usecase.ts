import { StartGameCommandSchema, UseCase } from '@packages/domain'
import { autoInjectable, inject } from 'tsyringe'
import { EventBus, WebSocketEventBus } from '~/eventbus'
import { GameRepository, GameRepositoryImpl } from '~/game/repository'

export type StartGameInput = StartGameCommandSchema & { gameId: string }

@autoInjectable()
export class StartGameUseCase implements UseCase<StartGameInput, void> {
    constructor(
        @inject(GameRepositoryImpl)
        private gameRepository: GameRepository,
        @inject(WebSocketEventBus)
        private eventBus: EventBus,
    ) {}

    async execute(input: StartGameInput): Promise<void> {
        const game = await this.gameRepository.from(input.gameId)
        game.start({
            playerId: input.playerId,
        })
        await this.gameRepository.save(game)
        const events = game.getDomainEvents()
        this.eventBus.broadcast(events)
    }
}
