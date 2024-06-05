import { AbstractRepository, Game, GameId } from '@packages/domain'

export interface GameRepository extends AbstractRepository<Game, GameId> {
    from(id: GameId): Promise<Game>
    save(data: Game): Promise<void>
}
