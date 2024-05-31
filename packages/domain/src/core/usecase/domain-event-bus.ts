import { AggregateRoot, DomainEvent } from '../entity'

export interface DomainEventBus {
    post(event: DomainEvent): void
    postAll<ID>(aggregateRoot: AggregateRoot<ID>): void
    register(object: object): void
    unregister(object: object): void
}
