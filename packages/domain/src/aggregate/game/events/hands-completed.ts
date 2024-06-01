import { Player } from '../entity'
import { DomainEvent } from '../../../core/entity'

export type HandsCompletedSchema = {
    player: Player
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
        playerId: string
        ranking: number
    }
}
