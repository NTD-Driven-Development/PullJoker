import { JoinRoomCommandSchema, UseCase } from '@packages/domain'
import { autoInjectable, inject } from 'tsyringe'
import { Retryable } from 'typescript-retry-decorator'
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

    @Retryable({
        maxAttempts: 3,
        backOff: 200,
        doRetry: (e: Error) => {
            return e.message.includes('aggregate_id_version')
        },
    })
    async execute(input: JoinRoomInput): Promise<void> {
        const version = await this.gameRepository.getLastVersion(input.gameId)
        const game = await this.gameRepository.from(input.gameId)
        game.joinRoom({
            playerId: input.playerId,
            playerName: input.playerName,
        })
        await this.gameRepository.save(game, version)
        const events = game.getDomainEvents()
        this.eventBus.broadcast(events)
    }
}
