import { GameId } from '../entity'
import { DomainEvent } from '../../../core/entity'
import { Card } from '../value-object'

export type CardDrawnSchema = {
    id: GameId
    card: Card
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
        gameId: string
        cardIndex: number
        fromPlayerId: string
    }
}
