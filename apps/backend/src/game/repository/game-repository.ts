import { Game, GameId } from '@packages/domain'

export interface GameRepository {
    from(id: GameId): Promise<Game>
    save(data: Game, version: number): Promise<void>
    getLastVersion(id: GameId): Promise<number>
}
