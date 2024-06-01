import { Card } from '../value-object/card'

export class Hands {
    private readonly cards: Card[] = []
    constructor() {}

    public getCards(): Card[] {
        return this.cards
    }
    public setCards(cards: Card[]): void {
        this.cards.push(...cards)
    }

    public checkHavingSameRankCards(rank: string): boolean {
        return this.cards.filter((card) => card.rank === rank).length > 1
    }
}
