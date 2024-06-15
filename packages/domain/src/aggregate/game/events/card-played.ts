import { GameId, HandCards } from '../entity'
import { DomainEvent } from '../../../core/entity'

export type CardPlayedSchema = {
    id: GameId
    cards: HandCards[]
    player: {
        id: string
        name: string
        hands: {
            cards?: HandCards[]
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
                cards?: HandCards[]
                cardCount: number
            }
        }
        cards: HandCards[]
    }
}
