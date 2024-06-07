import { GameId } from '../entity'
import { DomainEvent } from '../../../core/entity'
import { Card } from '../value-object'

export type CardPlayedSchema = {
    id: GameId
    cards: Card[]
    player: {
        id: string
        name: string
        hands: {
            cards?: Card[]
            cardCount: number
        }
    }
}

export class CardPlayed extends DomainEvent {
    constructor(public readonly data: CardPlayedSchema) {
        super('card-played', new Date())
    }
}

export type CardPlayedEventSchema = {
    type: 'card-played'
    data: {
        gameId: GameId
        player: {
            id: string
            name: string
            hands: {
                cards?: Card[]
                cardCount: number
            }
        }
        cards: Card[]
    }
}
