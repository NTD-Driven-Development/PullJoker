import { DrawCardCommandSchema, Player, UseCase } from '@packages/domain'
import { autoInjectable, inject } from 'tsyringe'
import { EventBus, WebSocketEventBus } from '~/eventbus'
import { DrawRandomCardFeatureToggle } from '~/feature-toggle'
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
        if (DrawRandomCardFeatureToggle.isEnabled()) {
            input.cardIndex = Math.floor(Math.random() * (game.currentPlayer as Player)?.getHands()?.getCards()?.length || 0)
        }
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
