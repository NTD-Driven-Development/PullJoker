import { GameId, Player } from '../entity'
import { DomainEvent } from '../../../core/entity'

export type PlayerJoinedRoomSchema = {
    id: GameId
    player: Player
}

export class PlayerJoinedRoom extends DomainEvent {
    constructor(public readonly data: PlayerJoinedRoomSchema) {
        super('player-joined-room', new Date())
    }
}

export type PlayerJoinedRoomEventSchema = {
    type: 'player-joined-room'
    data: {
        gameId: GameId
        player: { id: string; name: string }
    }
}

export type JoinRoomEventSchema = {
    type: 'join-room'
    data: {
        gameId: GameId
    }
}
