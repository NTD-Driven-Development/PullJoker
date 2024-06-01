import { DomainEvent } from '../../../core/entity'
import { GameStatus } from '../entity'

export type GameEndedSchema = {
    id: string
    status: GameStatus
    ranking: {
        playerId: string
        name: string
        rank: number
    }[]
}

export class GameEnded extends DomainEvent {
    constructor(public readonly data: GameEndedSchema) {
        super('game-ended', new Date())
    }
}

export type GameEndedEventSchema = {
    type: 'game-ended'
    data: {
        id: string
        status: GameStatus
        ranking: {
            playerId: string
            name: string
            rank: number
        }[]
    }
}
