import { GameId, GameStatus, Player } from '../entity'
import { DomainEvent } from '../../../core/entity'

export type GameStartedSchema = {
    id: GameId
    round: number
    players: Player[]
    status: GameStatus
}

export class GameStarted extends DomainEvent {
    constructor(public readonly data: GameStartedSchema) {
        super('game-started', new Date())
    }
}

export type GameStartedEventSchema = {
    type: 'game-started'
    data: {
        gameId: GameId
        round: number
        players: { id: string; name: string }[]
    }
}

export type StartGameEventSchema = {
    type: 'start-game'
    data: {
        players: { id: string; name: string }[]
    }
}
