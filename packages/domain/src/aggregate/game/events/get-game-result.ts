import { DomainEvent } from '../../../core'
import { GameId, GameStatus } from '../entity'
import { Card } from '../value-object'

export type GetGameResultSchema = {
    id: GameId
    status: GameStatus
    round: number | null
    players:
        | {
              id: string
              name: string
              hands: {
                  cards?: Card[]
                  cardCount: number
              } | null
          }[]
        | null
    deck: {
        cards: Card[]
    } | null
    currentPlayer: {
        id: string
        name: string
    } | null
    nextPlayer: {
        id: string
        name: string
    } | null
}

export class GetGameResult extends DomainEvent {
    constructor(public readonly data: GetGameResultSchema) {
        super('get-game-result', new Date())
    }
}

export type GetGameResultEventSchema = {
    type: 'get-game-result'
    data: GetGameResultSchema
}

export type GetGameEventSchema = {
    type: 'get-game'
    data: {
        gameId: string
    }
}
