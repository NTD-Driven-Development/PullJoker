import { DomainEvent } from './domain-event'

export interface DomainEventSource<E extends DomainEvent> {
    apply(event: E): void
    clearDomainEvents(): void
    getDomainEvents(): E[]
    getLatestDomainEvent(): E
    getDomainEventSize(): number
}
