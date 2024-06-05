import { JoinRoomCommandSchema, UseCase } from '@packages/domain'
import { autoInjectable, inject } from 'tsyringe'
import { EventBus, WebSocketEventBus } from '~/eventbus'
import { GameRepository, GameRepositoryImpl } from '~/game/repository'

export type JoinRoomInput = JoinRoomCommandSchema & { gameId: string }

@autoInjectable()
export class JoinRoomUseCase implements UseCase<JoinRoomInput, void> {
    constructor(
        @inject(GameRepositoryImpl)
        private gameRepository: GameRepository,
        @inject(WebSocketEventBus)
        private eventBus: EventBus,
    ) {}

    async execute(input: JoinRoomInput): Promise<void> {
        const game = await this.gameRepository.from(input.gameId)
        game.joinRoom({
            playerId: input.playerId,
            playerName: input.playerName,
        })
        await this.gameRepository.save(game)
        const events = game.getDomainEvents()
        this.eventBus.broadcast(events)
    }
}
