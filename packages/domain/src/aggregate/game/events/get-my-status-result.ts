import { DomainEvent } from '../../../core'

export type GetMyStatusResultSchema = {
    id: string
    name: string
}

export class GetMyStatusResult extends DomainEvent {
    constructor(public readonly data: GetMyStatusResultSchema) {
        super('get-my-status-result', new Date())
    }
}

export type GetMyStatusResultEventSchema = {
    type: 'get-my-status-result'
    data: GetMyStatusResultSchema
}

export type GetMyStatusEventSchema = {
    type: 'get-my-status'
    data: null
}
