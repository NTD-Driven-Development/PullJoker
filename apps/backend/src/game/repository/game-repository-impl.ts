import {
    CardDealt,
    CardDrawn,
    CardPlayed,
    Game,
    GameEnded,
    GameId,
    GameStarted,
    HandsCompleted,
    PlayerJoinedRoom,
    PlayerLeftRoom,
    RoomCreated,
} from '@packages/domain'
import { GameRepository } from '~/game/repository/game-repository'
import { EventStore } from '~/data/entity'
import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { AppDataSource } from '~/data/data-source'

@injectable()
export class GameRepositoryImpl implements GameRepository {
    private repo: Repository<EventStore>
    public constructor() {
        this.repo = AppDataSource.getRepository(EventStore)
    }

    private async getLastVersion(id: GameId): Promise<number> {
        const events = await this.repo.find({ where: { aggregateId: id } })
        return events.length
    }

    public async from(id: GameId): Promise<Game> {
        const events = await this.repo.find({ where: { aggregateId: id } })
        if (events.length === 0) {
            throw new Error(`Game not found: ${id}`)
        }
        return toDomain(events)
    }

    public async save(aggregate: Game): Promise<void> {
        const version = await this.getLastVersion(aggregate.getId())
        await this.repo.save(toData(aggregate, version))
    }

    public findById(id: string): Promise<Game> {
        throw new Error('Method not implemented.')
    }
    public delete(entity: Game): Promise<void> {
        throw new Error('Method not implemented.')
    }
}

function toData(game: Game, lastVersion: number): EventStore[] {
    let version = lastVersion + 1
    return game.getDomainEvents().map((event) => {
        const data = new EventStore()
        data.aggregateId = game.getId()
        data.eventType = event.getType()
        data.eventData = event.getData()
        data.version = version++
        data.occurredOn = event.getOccurredOn()
        return data
    })
}

function toDomain(events: EventStore[]) {
    return new Game(
        events.map((event) => {
            const data = JSON.parse(event.eventData)
            switch (event.eventType) {
                case 'room-created':
                    return new RoomCreated(data)
                case 'player-joined-room':
                    return new PlayerJoinedRoom(data)
                case 'player-left-room':
                    return new PlayerLeftRoom(data)
                case 'game-started':
                    return new GameStarted(data)
                case 'game-ended':
                    return new GameEnded(data)
                case 'card-dealt':
                    return new CardDealt(data)
                case 'card-played':
                    return new CardPlayed(data)
                case 'card-drawn':
                    return new CardDrawn(data)
                case 'hands-completed':
                    return new HandsCompleted(data)
                default:
                    throw new Error(`Unsupported event type: ${event.eventType}`)
            }
        }),
    )
}
