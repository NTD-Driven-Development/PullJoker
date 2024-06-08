import { Card } from '../value-object/card'

export type HandCards = Card & {
    index: number
}
export class Hands {
    private cards: HandCards[] = []
    constructor() {}

    public getCards(): HandCards[] {
        return this.cards
    }
    public setCards(cards: Card[]): void {
        this.cards = cards.map((card, index) => ({ ...card, index }))
    }

    public checkHavingSameRankCards(rank: string): boolean {
        return this.cards.filter((card) => card.rank === rank).length > 1
    }
}
