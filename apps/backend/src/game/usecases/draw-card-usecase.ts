import { DrawCardCommandSchema, UseCase } from '@packages/domain'
import { autoInjectable, inject } from 'tsyringe'
import { EventBus, WebSocketEventBus } from '~/eventbus'
import { GameRepository, GameRepositoryImpl } from '~/game/repository'

export type DrawCardInput = DrawCardCommandSchema & { gameId: string }

@autoInjectable()
export class DrawCardUseCase implements UseCase<DrawCardInput, void> {
    constructor(
        @inject(GameRepositoryImpl)
        private gameRepository: GameRepository,
        @inject(WebSocketEventBus)
        private eventBus: EventBus,
    ) {}

    async execute(input: DrawCardInput): Promise<void> {
        const game = await this.gameRepository.from(input.gameId)
        game.drawCard({
            fromPlayerId: input.fromPlayerId,
            toPlayerId: input.toPlayerId,
            cardIndex: input.cardIndex,
        })
        await this.gameRepository.save(game)
        const events = game.getDomainEvents()
        this.eventBus.broadcast(events)
    }
}
