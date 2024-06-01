import { Player } from '../entity'
import { DomainEvent } from '../../../core/entity'
import { Card } from '../value-object'

export type CardDrawnSchema = {
    card: Card
    cardIndex: number
    fromPlayer: Player
    toPlayer: Player
}

export class CardDrawn extends DomainEvent {
    constructor(public readonly data: CardDrawnSchema) {
        super('card-drawn', new Date())
    }
}

export type CardDrawnEventSchema = {
    type: 'card-drawn'
    data: {
        card?: Card
        cardIndex: number
        fromPlayer: {
            id: string
            name: string
            hands: {
                cards?: Card[]
                cardCount: number
            }
        }
        toPlayer: {
            id: string
            name: string
            hands: {
                cards?: Card[]
                cardCount: number
            }
        }
    }
}

export type DrawCardEventSchema = {
    type: 'draw-card'
    data: {
        cardIndex: number
        fromPlayerId: string
    }
}
