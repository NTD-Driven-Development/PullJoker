import {
    CardDealtEventSchema,
    CardDrawnEventSchema,
    CardPlayedEventSchema,
    DrawCardEventSchema,
    GameEndedEventSchema,
    GameStartedEventSchema,
    HandsCompletedEventSchema,
    StartGameEventSchema,
} from '@packages/domain'
import { Socket as BaseServer } from 'socket.io'
import { Socket as BaseClient } from 'socket.io-client'

interface ServerToClientEvents {
    'validation-error': (error: string) => void
    'game-started': (event: GameStartedEventSchema) => void
    'card-drawn': (event: CardDrawnEventSchema) => void
    'card-dealt': (event: CardDealtEventSchema) => void
    'card-played': (event: CardPlayedEventSchema) => void
    'hands-completed': (event: HandsCompletedEventSchema) => void
    'game-end': (event: GameEndedEventSchema) => void
}

interface ClientToServerEvents {
    'start-game': (event: StartGameEventSchema) => void
    'draw-card': (event: DrawCardEventSchema) => void
}

export type Server = BaseServer<ClientToServerEvents, ServerToClientEvents>
export type Client = BaseClient<ServerToClientEvents, ClientToServerEvents>
