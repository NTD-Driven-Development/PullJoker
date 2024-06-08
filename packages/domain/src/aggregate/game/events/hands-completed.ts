import { DomainEvent } from '../../../core/entity'
import { Card } from '../value-object'

export type HandsCompletedSchema = {
    id: string
    player: {
        id: string
        name: string
        hands: {
            cards: Card[]
            cardCount: number
        }
    }
    ranking: number
}

export class HandsCompleted extends DomainEvent {
    constructor(public readonly data: HandsCompletedSchema) {
        super('hands-completed', new Date())
    }
}

export type HandsCompletedEventSchema = {
    type: 'hands-completed'
    data: {
        gameId: string
        playerId: string
        ranking: number
    }
}
