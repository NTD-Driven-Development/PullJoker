import {
    DomainEvent,
} from '@packages/domain'
import { EventBus } from '~/eventbus/eventbus'
import { Server } from '@packages/socket'
import { autoInjectable, inject } from 'tsyringe'
import { Socket } from 'socket.io'

@autoInjectable()
export class WebSocketEventBus implements EventBus {
    private readonly socket: Server

    public constructor(@inject(Socket) socket: Server) {
        this.socket = socket
    }

    public broadcast(events: DomainEvent[]) {
        events.forEach((event) => {
            this.handle(event)
        })
    }

    private handle(event: DomainEvent) {
        switch (true) {
            default:
                throw new Error(`Unsupported event: ${event.constructor.name}`)
        }
    }
}
