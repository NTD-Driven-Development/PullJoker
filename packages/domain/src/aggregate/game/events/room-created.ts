import { GameId, GameStatus } from '../entity'
import { DomainEvent } from '../../../core/entity'

export type RoomCreatedSchema = {
    id: GameId
    status: GameStatus
}

export class RoomCreated extends DomainEvent {
    constructor(public readonly data: RoomCreatedSchema) {
        super('room-created', new Date())
    }
}

export type RoomCreatedEventSchema = {
    type: 'room-created'
    data: {
        gameId: GameId
    }
}

export type CreateRoomEventSchema = {
    type: 'create-room'
    data: null
}
