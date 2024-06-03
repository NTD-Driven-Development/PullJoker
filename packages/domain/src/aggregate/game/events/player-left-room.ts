import { GameId, Player } from '../entity'
import { DomainEvent } from '../../../core/entity'

export type PlayerLeftRoomSchema = {
    id: GameId
    player: Player
}

export class PlayerLeftRoom extends DomainEvent {
    constructor(public readonly data: PlayerLeftRoomSchema) {
        super('player-left-room', new Date())
    }
}

export type PlayerLeftRoomEventSchema = {
    type: 'player-left-room'
    data: {
        gameId: GameId
        player: { id: string; name: string }
    }
}

export type LeaveRoomEventSchema = {
    type: 'leave-room'
    data: {
        gameId: GameId
        player: { id: string; name: string }
    }
}
