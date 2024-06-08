/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuidv4 } from 'uuid'

export abstract class DomainEvent {
    private readonly id: string
    private readonly occurredOn: Date
    // protected readonly version: number
    public readonly type: string
    public readonly data: any

    constructor(type: string, occurredOn: Date) {
        this.id = uuidv4()
        this.occurredOn = occurredOn
        this.type = type
    }

    public getEventId(): string {
        return this.id
    }

    public getOccurredOn(): Date {
        return this.occurredOn
    }

    public getType(): string {
        return this.type
    }

    public getData(): any {
        return this.data
    }

    // public getVersion(): number {
    //     return this.version
    // }
}
