import { Deck, GameId, Player } from '../entity'
import { DomainEvent } from '../../../core/entity'
import { Card } from '../value-object'

export type CardDealtSchema = {
    id: GameId
    round: number
    deck: Deck
    players: Player[]
    currentPlayer: Player
    nextPlayer: Player
}

export class CardDealt extends DomainEvent {
    constructor(public readonly data: CardDealtSchema) {
        super('card-dealt', new Date())
    }
}

export type CardDealtEventSchema = {
    type: 'card-dealt'
    data: {
        gameId: GameId
        round: number
        deck: {
            cards: Card[]
        }
        players: {
            id: string
            name: string
            hands: {
                cards?: Card[]
                cardCount: number
            }
        }[]
        currentPlayer: Player
        nextPlayer: Player
    }
}
