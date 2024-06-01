import { Rank } from './rank'
import { Suit } from './suit'

export class Card {
    constructor(
        public readonly suit: Suit,
        public readonly rank: Rank,
    ) {}
}
