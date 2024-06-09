import { GetGameResult, UseCase } from '@packages/domain'
import { autoInjectable, inject } from 'tsyringe'
import { Retry } from '~/decorators'
import { GameRepository, GameRepositoryImpl } from '~/game/repository'

export type GetGameInput = { gameId: string; userId: string }
export type GetGameOutput = GetGameResult

@autoInjectable()
export class GetGameUseCase implements UseCase<GetGameInput, GetGameOutput> {
    constructor(
        @inject(GameRepositoryImpl)
        private gameRepository: GameRepository,
    ) {}

    @Retry
    async execute(input: GetGameInput): Promise<GetGameOutput> {
        const game = await this.gameRepository.from(input.gameId)
        return new GetGameResult({
            id: game.getId(),
            status: game.getGameStatus(),
            round: game.round,
            players: game.players.map((player) => {
                const isMe = player.getId() === input.userId
                return {
                    id: player.getId(),
                    name: player.name,
                    hands:
                        game.getGameStatus() === 'WAITING'
                            ? null
                            : {
                                  cards: isMe ? player.getHands()?.getCards() : undefined,
                                  cardCount: player.getHands()?.getCards()?.length || 0,
                              },
                }
            }),
            deck:
                game.getGameStatus() === 'WAITING'
                    ? null
                    : {
                          cards: game.deck ? game.deck.getCards() : [],
                      },
            currentPlayer:
                game.getGameStatus() === 'WAITING'
                    ? null
                    : {
                          id: game.currentPlayer?.getId() || '',
                          name: game.currentPlayer?.name || '',
                      },
            nextPlayer:
                game.getGameStatus() === 'WAITING'
                    ? null
                    : {
                          id: game.nextPlayer?.getId() || '',
                          name: game.nextPlayer?.name || '',
                      },
        })
    }
}
