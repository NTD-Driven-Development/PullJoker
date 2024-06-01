import { Entity } from '../../../core'
import { Card } from '../value-object'
import { Hands } from './hands'

export class Player implements Entity<string> {
    private hands!: Hands
    public isFinished: boolean = false
    constructor(
        private id: string,
        public name: string,
    ) {}

    public getId(): string {
        return this.id
    }

    public playCards(cards: Card[]): void {
        if (this.checkPlayCardInvariant(cards)) {
            throw new Error('Invalid cards')
        }
        const cardPlayed = this.hands.getCards().filter((card) => !cards.includes(card))
        this.hands.setCards(cardPlayed)
    }

    private checkPlayCardInvariant(cards: Card[]) {
        return (
            cards.length !== 2 ||
            this.hands.getCards().length < 2 ||
            cards[0].rank !== cards[1].rank ||
            cards[0].suit !== cards[1].suit ||
            cards[0].rank === 'JOKER_1' ||
            cards[0].rank === 'JOKER_2' ||
            cards[1].rank === 'JOKER_1' ||
            cards[1].rank === 'JOKER_2' ||
            cards[0].suit === 'JOKER' ||
            cards[1].suit === 'JOKER'
        )
    }

    public drawCard(player: Player, cardIndex: number): Card {
        if (this.checkDrawCardInvariant(cardIndex, player)) {
            throw new Error('Invalid card index')
        }
        const card = player.hands.getCards()[cardIndex]
        this.hands.setCards([...this.hands.getCards(), card])
        player.hands.setCards(player.hands.getCards().filter((_, index) => index !== cardIndex))
        return card
    }

    private checkDrawCardInvariant(cardIndex: number, player: Player) {
        return cardIndex < 0 || cardIndex > player.hands.getCards().length - 1
    }

    public getHands(): Hands {
        return this.hands
    }

    public setHands(hands: Hands): void {
        this.hands = hands
    }

    public getTwoSameRankCards(): Card[] {
        const cards = this.hands.getCards()
        const card = cards.find((card) => this.hands.checkHavingSameRankCards(card.rank))
        if (!card) {
            return []
        }
        return cards.filter((c) => c.rank === card.rank).slice(0, 2)
    }

    public checkHandsEmpty(): boolean {
        return this.hands.getCards().length === 0
    }
}
