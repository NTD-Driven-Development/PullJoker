import { DrawCardCommandSchema, GetGameResult, Player, UseCase } from '@packages/domain'
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
        const afterGame = await this.gameRepository.from(input.gameId)
        this.eventBus.broadcast([
            new GetGameResult({
                id: afterGame.getId(),
                status: afterGame.getGameStatus(),
                round: afterGame.round,
                players: afterGame.players.map((player) => {
                    return {
                        id: player.getId(),
                        name: player.name,
                        hands:
                            afterGame.getGameStatus() === 'WAITING'
                                ? null
                                : {
                                      cards: player.getHands()?.getCards(),
                                      cardCount: player.getHands()?.getCards()?.length || 0,
                                  },
                    }
                }),
                deck:
                    afterGame.getGameStatus() === 'WAITING'
                        ? null
                        : {
                              cards: afterGame.deck ? afterGame.deck.getCards() : [],
                          },
                currentPlayer:
                    afterGame.getGameStatus() === 'WAITING'
                        ? null
                        : {
                              id: afterGame.currentPlayer?.getId() || '',
                              name: afterGame.currentPlayer?.name || '',
                          },
                nextPlayer:
                    afterGame.getGameStatus() === 'WAITING'
                        ? null
                        : {
                              id: afterGame.nextPlayer?.getId() || '',
                              name: afterGame.nextPlayer?.name || '',
                          },
            }),
        ])
    }
}
