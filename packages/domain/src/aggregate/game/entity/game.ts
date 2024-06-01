/* eslint-disable @typescript-eslint/no-explicit-any */
import { AggregateRoot, DomainEvent } from '../../../core'
import { DrawCardCommandSchema, StartGameCommandSchema } from '../command'
import { GameStarted, CardDealt, CardPlayed, CardDrawn, HandsCompleted, GameEnded } from '../events'
import { Player } from './player'

export type GameId = string
export type GameStatus = 'WAITING' | 'PLAYING' | 'END'

export class Game extends AggregateRoot<GameId> {
    private static readonly MAX_PLAYERS = 4
    public deck!: Deck
    public players!: Player[]
    public currentPlayer: Player | null = null
    public nextPlayer: Player | null = null
    public finishedPlayers: Player[] = []

    constructor(events: DomainEvent[])
    constructor(id: GameId, status: GameStatus, round: number)
    constructor(
        id: any,
        protected status: GameStatus = 'WAITING',
        public round: number = 1,
    ) {
        super(id)
    }

    public start(payload: StartGameCommandSchema): void {
        if (payload.players.length !== 4) {
            throw new Error('Game must have 4 players')
        }
        this.apply(
            new GameStarted({
                id: this.id,
                round: 1,
                status: 'PLAYING',
                players: payload.players.map((player) => new Player(player.getId(), player.name)),
            }),
        )
        this.initDeckAndDeal()
        this.autoPlayCard()
    }

    private autoPlayCard() {
        this.players.forEach((player) => {
            if (player.getTwoSameRankCards()) {
                this.playCard(player, player.getTwoSameRankCards())
            }
        })
    }

    private initDeckAndDeal(): void {
        const deck = new Deck()
        deck.newDeck()
        const players = this.players.map((player, index) => {
            const hands = new Hands()
            if (index === Math.floor(Math.random() * Game.MAX_PLAYERS)) {
                hands.setCards(deck.deal(14))
            } else {
                hands.setCards(deck.deal(13))
            }
            player.setHands(hands)
            return player
        })
        this.apply(
            new CardDealt({
                id: this.id,
                round: 1,
                deck,
                players,
                currentPlayer: players[0],
                nextPlayer: players[1],
            }),
        )
    }

    private playCard(player: Player, cards: Card[]): void {
        player.playCards(cards)
        this.apply(
            new CardPlayed({
                cards: cards,
                player,
            }),
        )
    }

    public drawCard(payload: DrawCardCommandSchema): void {
        const fromPlayer = this.findPlayerById(payload.fromPlayerId)
        const toPlayer = this.findPlayerById(payload.toPlayerId)
        const card = toPlayer.drawCard(fromPlayer, payload.cardIndex)
        this.apply(
            new CardDrawn({
                card: card,
                cardIndex: payload.cardIndex,
                fromPlayer,
                toPlayer,
            }),
        )
        if (fromPlayer.checkHandsEmpty()) {
            this.apply(
                new HandsCompleted({
                    player: fromPlayer,
                    ranking: this.finishedPlayers.length + 1,
                }),
            )
        }
        if (toPlayer.getTwoSameRankCards()) {
            this.playCard(toPlayer, toPlayer.getTwoSameRankCards())
        }
        if (toPlayer.checkHandsEmpty()) {
            this.apply(
                new HandsCompleted({
                    player: toPlayer,
                    ranking: this.finishedPlayers.length + 1,
                }),
            )
        }
    }

    private findPlayerById(playerId: string) {
        const player = this.players.find((p) => p.getId() === playerId)
        if (!player) {
            throw new Error('Player not found')
        }
        return player
    }

    protected when(event: DomainEvent): void {
        switch (true) {
            case event instanceof GameStarted:
                this.players = event.data.players
                break
            case event instanceof CardDealt:
                this.round = event.data.round
                this.deck = event.data.deck
                this.players = event.data.players
                this.currentPlayer = event.data.currentPlayer
                this.nextPlayer = event.data.nextPlayer
                break
            case event instanceof CardPlayed:
                this.players = this.players.map((player) => {
                    if (player.getId() === event.data.player.getId()) {
                        return event.data.player
                    }
                    return player
                })
                this.deck.addCards(event.data.cards)
                break
            case event instanceof CardDrawn:
                this.players = this.players.map((player) => {
                    if (player.getId() === event.data.fromPlayer.getId()) {
                        return event.data.fromPlayer
                    }
                    if (player.getId() === event.data.toPlayer.getId()) {
                        return event.data.toPlayer
                    }
                    return player
                })
                this.currentPlayer = this.nextPlayer
                this.nextPlayer = this.toNextPlayer()
                this.checkGameIsOver()
                this.round =
                    this.players[0].getId() === this.currentPlayer?.getId()
                        ? this.round + 1
                        : this.round
                break
            case event instanceof HandsCompleted:
                this.finishedPlayers.push(event.data.player)
                break
            case event instanceof GameEnded:
                this.status = event.data.status
                break
        }
    }

    private checkGameIsOver() {
        if (!this.nextPlayer) {
            this.apply(
                new GameEnded({
                    id: this.id,
                    status: 'END',
                    ranking: this.players.map((player, index) => ({
                        playerId: this.finishedPlayers[index].getId() || player.getId(),
                        name: this.finishedPlayers[index].name || player.name,
                        rank: index + 1,
                    })),
                }),
            )
        }
    }

    private toNextPlayer(): Player | null {
        const beforeNext = this.players.indexOf(this.nextPlayer as Player)
        for (let i = 1; i < Game.MAX_PLAYERS; i++) {
            const next = (beforeNext + i) % Game.MAX_PLAYERS
            if (!this.players[next].checkHandsEmpty()) {
                return this.players[next]
            }
        }
        return null
    }
}

import { Card, Rank, Suit } from '../value-object'
import { Hands } from './hands'

export class Deck {
    private cards: Card[] = []

    public deal(count: number): Card[] {
        return this.cards.splice(0, count)
    }

    public newDeck(): void {
        const suits: Suit[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES']
        const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
        suits.forEach((s) => {
            ranks.forEach((r) => {
                this.cards.push(new Card(s, r))
            })
        })
        this.cards.push(new Card('JOKER', 'JOKER_1'))
        this.shuffle()
    }

    public shuffle(): void {
        this.cards.sort(() => Math.random() - 0.5)
    }

    public addCards(cards: Card[]): void {
        this.cards.push(...cards)
    }

    public getCards(): Card[] {
        return this.cards
    }
}
