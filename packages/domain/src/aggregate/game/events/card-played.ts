import { Player } from '../entity'
import { DomainEvent } from '../../../core/entity'
import { Card } from '../value-object'

export type CardPlayedSchema = {
    cards: Card[]
    player: Player
}

export class CardPlayed extends DomainEvent {
    constructor(public readonly data: CardPlayedSchema) {
        super('card-played', new Date())
    }
}

export type CardPlayedEventSchema = {
    type: 'card-played'
    data: {
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
