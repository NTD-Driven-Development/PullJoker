import { DrawCardCommandSchema, Player, UseCase } from '@packages/domain'
import { autoInjectable, inject } from 'tsyringe'
import { Retryable } from 'typescript-retry-decorator'
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

    @Retryable({
        maxAttempts: 3,
        backOff: 200,
        doRetry: (e: Error) => {
            return e.message.includes('aggregate_id_version')
        },
    })
    async execute(input: DrawCardInput): Promise<void> {
        const version = await this.gameRepository.getLastVersion(input.gameId)
        const game = await this.gameRepository.from(input.gameId)
        if (DrawRandomCardFeatureToggle.isEnabled()) {
            input.cardIndex = Math.floor(Math.random() * (game.currentPlayer as Player)?.getHands()?.getCards()?.length || 0)
        }
        game.drawCard({
            fromPlayerId: input.fromPlayerId,
            toPlayerId: input.toPlayerId,
            cardIndex: input.cardIndex,
        })
        await this.gameRepository.save(game, version)
        const events = game.getDomainEvents()
        this.eventBus.broadcast(events)
    }
}
