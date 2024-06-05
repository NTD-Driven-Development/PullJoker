import { Card } from '../value-object/card'

export class Hands {
    private cards: Card[] = []
    constructor() {}

    public getCards(): Card[] {
        return this.cards
    }
    public setCards(cards: Card[]): void {
        this.cards = cards
    }

    public checkHavingSameRankCards(rank: string): boolean {
        return this.cards.filter((card) => card.rank === rank).length > 1
    }
}
