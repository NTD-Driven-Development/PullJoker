import { GetGameResult, StartGameCommandSchema, UseCase } from '@packages/domain'
import { autoInjectable, inject } from 'tsyringe'
import { Retry } from '~/decorators'
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

    @Retry
    async execute(input: StartGameInput): Promise<void> {
        const version = await this.gameRepository.getLastVersion(input.gameId)
        const game = await this.gameRepository.from(input.gameId)
        game.start({
            playerId: input.playerId,
        })
        await this.gameRepository.save(game, version)
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
