import { Entity, Column, BaseEntity, PrimaryColumn } from 'typeorm'

@Entity('event_store')
export class EventStore extends BaseEntity {
    @PrimaryColumn({ type: 'uuid', name: 'stream_id', generated: 'uuid' })
    streamId!: string

    @Column({ type: 'uuid', name: 'aggregate_id' })
    aggregateId!: string

    @Column({ type: 'varchar', name: 'event_type', nullable: false })
    eventType!: string

    @Column({ type: 'text', name: 'event_data' })
    eventData!: string

    @Column({ type: 'timestamp', name: 'occurred_on', default: () => 'CURRENT_TIMESTAMP' })
    occurredOn!: Date
}
