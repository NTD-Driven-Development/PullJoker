import { DomainEvent } from '@packages/domain'

export interface EventBus {
    broadcast(events: DomainEvent[]): void
}
