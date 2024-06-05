/* eslint-disable @typescript-eslint/no-explicit-any */
import { DomainEvent } from './domain-event'
import { Entity } from './entity'

export abstract class AggregateRoot<ID> implements Entity<ID> {
    private domainEvents: DomainEvent[] = []
    protected id!: ID
    protected version: number = 1
    constructor(id: ID)
    constructor(events: DomainEvent[])
    constructor(id?: any) {
        if (typeof id === 'string') {
            this.id = id as ID
            this.domainEvents = []
        } else if (Array.isArray(id)) {
            for (const event of id) {
                this.apply(event)
            }
            this.clearDomainEvents()
        }
    }

    public getId(): ID {
        return this.id as ID
    }

    public addDomainEvent(event: DomainEvent): void {
        this.domainEvents.push(event)
    }

    public getDomainEvents(): DomainEvent[] {
        return this.domainEvents || []
    }

    public clearDomainEvents(): void {
        this.domainEvents = []
    }

    public getVersion(): number {
        return this.version
    }

    public setVersion(version: number): void {
        this.version = version
    }

    protected abstract when(event: DomainEvent): void

    protected ensureInvariant(): void {}

    protected apply(event: DomainEvent): void {
        this.ensureInvariant()

        this.when(event)

        this.version++

        this.ensureInvariant()

        this.addDomainEvent(event)
    }
}
