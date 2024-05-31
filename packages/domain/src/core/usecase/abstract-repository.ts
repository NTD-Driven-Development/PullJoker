export abstract class AbstractRepository<T, ID> {
    public abstract findById(id: ID): Promise<T | null>
    public abstract save(entity: T): Promise<void>
    public abstract delete(entity: T): Promise<void>
}
