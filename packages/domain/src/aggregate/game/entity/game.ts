/* eslint-disable @typescript-eslint/no-explicit-any */
import { AggregateRoot, DomainEvent } from '../../../core'
import {
    DrawCardCommandSchema,
    JoinRoomCommandSchema,
    LeaveRoomCommandSchema,
    StartGameCommandSchema,
} from '../command'
import {
    GameStarted,
    CardDealt,
    CardPlayed,
    CardDrawn,
    HandsCompleted,
    GameEnded,
    RoomCreated,
    PlayerJoinedRoom,
    PlayerLeftRoom,
} from '../events'
import { Player } from './player'

export type GameId = string
export type GameStatus = 'WAITING' | 'PLAYING' | 'END'
export const MAX_PLAYERS_LENGTH = 4

export class Game extends AggregateRoot<GameId> {
    private static readonly MAX_PLAYERS = MAX_PLAYERS_LENGTH
    public deck!: Deck
    public players: Player[] = []
    public currentPlayer!: Player | null
    public nextPlayer!: Player | null
    public finishedPlayers!: {
        id: string
        name: string
    }[]
    public round!: number

    constructor(events: DomainEvent[])
    constructor(id: GameId, status: GameStatus)
    constructor(
        id: any,
        protected status: GameStatus = 'WAITING',
    ) {
        super(id)
        if (Array.isArray(id)) {
            this.applyEvents(id)
        } else {
            this.apply(new RoomCreated({ id, status }))
        }
    }

    public getGameStatus(): GameStatus {
        return this.status
    }

    public joinRoom(payload: JoinRoomCommandSchema): void {
        if (this.players.length >= Game.MAX_PLAYERS) {
            throw new Error('Room is full')
        }
        if (this.players.some((player) => player.getId() === payload.playerId)) {
            throw new Error('Player already in room')
        }
        this.apply(
            new PlayerJoinedRoom({
                id: this.id,
                player: new Player(payload.playerId, payload.playerName),
            }),
        )
    }

    public leaveRoom(payload: LeaveRoomCommandSchema): void {
        const player = this.findPlayerById(payload.playerId)
        this.apply(
            new PlayerLeftRoom({
                id: this.id,
                player: player,
            }),
        )
    }

    public start(payload: StartGameCommandSchema): void {
        // only room member can start the game
        if (this.players.every((player) => player.getId() !== payload.playerId)) {
            throw new Error('Only room member can start the game')
        }
        if (this.players.length !== 4) {
            throw new Error('Game must have 4 players')
        }
        this.apply(
            new GameStarted({
                id: this.id,
                round: 1,
                status: 'PLAYING',
                players: this.players,
            }),
        )
        this.initDeckAndDeal()
        this.autoPlayCard()
    }

    private autoPlayCard() {
        this.players.forEach((player) => {
            while (player.haveTwoSameRankCards()) {
                this.playCard(player, player.getTwoSameRankCards())
            }
        })
    }

    private initDeckAndDeal(): void {
        const deck = new Deck()
        deck.newDeck()
        const randomIndex = Math.floor(Math.random() * Game.MAX_PLAYERS)
        const players = this.players.map((player, index) => {
            const hands = new Hands()
            if (index === randomIndex) {
                const cards = deck.deal(14)
                hands.setCards(cards)
            } else {
                const cards = deck.deal(13)
                hands.setCards(cards)
            }
            player.setHands(hands)
            return {
                id: player.getId(),
                name: player.name,
                hands: {
                    cards: hands.getCards(),
                    cardCount: hands.getCards().length,
                },
            }
        })
        this.apply(
            new CardDealt({
                id: this.id,
                round: 1,
                deck: { cards: deck.getCards() },
                players: players,
                currentPlayer: players[0],
                nextPlayer: players[1],
            }),
        )
    }

    private playCard(player: Player, cards: Card[]): void {
        const playerCardPlayed = player
            .getHands()
            .getCards()
            .filter((card) => cards.includes(card))
        player.playCards(cards)
        this.apply(
            new CardPlayed({
                id: this.id,
                cards: playerCardPlayed,
                player: {
                    id: player.getId(),
                    name: player.name,
                    hands: {
                        cards: player.getHands().getCards(),
                        cardCount: player.getHands().getCards().length,
                    },
                },
            }),
        )
    }

    public drawCard(payload: DrawCardCommandSchema): void {
        this.verifyPlayerTurn(payload)
        const fromPlayer = this.findPlayerById(payload.fromPlayerId)
        const toPlayer = this.findPlayerById(payload.toPlayerId)
        const card = toPlayer.drawCard(fromPlayer, payload.cardIndex)
        this.apply(
            new CardDrawn({
                id: this.id,
                card: card,
                cardIndex: payload.cardIndex,
                fromPlayer: {
                    id: fromPlayer.getId(),
                    name: fromPlayer.name,
                    hands: {
                        cards: fromPlayer.getHands().getCards(),
                        cardCount: fromPlayer.getHands().getCards().length,
                    },
                },
                toPlayer: {
                    id: toPlayer.getId(),
                    name: toPlayer.name,
                    hands: {
                        cards: toPlayer.getHands().getCards(),
                        cardCount: toPlayer.getHands().getCards().length,
                    },
                },
            }),
        )
        if (fromPlayer.checkHandsEmpty()) {
            this.completeHandsAndCheckGame(fromPlayer)
        }
        if (toPlayer.haveTwoSameRankCards()) {
            this.playCard(toPlayer, toPlayer.getTwoSameRankCards())
        }
        if (toPlayer.checkHandsEmpty()) {
            this.completeHandsAndCheckGame(toPlayer)
        }
    }

    private completeHandsAndCheckGame(player: Player) {
        this.apply(
            new HandsCompleted({
                id: this.id,
                player: {
                    id: player.getId(),
                    name: player.name,
                    hands: {
                        cards: player.getHands().getCards(),
                        cardCount: player.getHands().getCards().length,
                    },
                },
                ranking: this.finishedPlayers.length + 1,
            }),
        )
        this.checkGameIsOver()
    }

    private verifyPlayerTurn(payload: DrawCardCommandSchema) {
        if (this.nextPlayer?.getId() !== payload.toPlayerId) {
            throw new Error('Not your turn')
        }
        if (this.currentPlayer?.getId() !== payload.fromPlayerId) {
            throw new Error('You cannot draw card for this player')
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
            case event instanceof RoomCreated:
                this.id = event.data.id
                this.status = event.data.status
                this.players = []
                this.currentPlayer = null
                this.nextPlayer = null
                this.finishedPlayers = []
                this.round = 0
                break
            case event instanceof PlayerJoinedRoom:
                this.addPlayer(new Player(event.data.player.id, event.data.player.name))
                break
            case event instanceof PlayerLeftRoom:
                this.players = this.players.filter(
                    (player) => player.getId() !== event.data.player.getId(),
                )
                break
            case event instanceof GameStarted:
                this.round = event.data.round
                this.status = event.data.status
                break
            case event instanceof CardDealt:
                const deck = new Deck()
                deck.addCards(event.data.deck.cards)
                this.round = event.data.round
                this.deck = deck
                this.players = event.data.players.map((player) => {
                    const p = new Player(player.id, player.name)
                    const h = new Hands()
                    h.setCards(player.hands.cards || [])
                    p.setHands(h)
                    return p
                })
                this.currentPlayer =
                    this.players.find((p) => p.getId() === event.data.currentPlayer?.id) || null
                this.nextPlayer =
                    this.players.find((p) => p.getId() === event.data.nextPlayer?.id) || null
                break
            case event instanceof CardPlayed:
                this.players = this.players.map((player) => {
                    if (player.getId() === event.data.player.id) {
                        const h = new Hands()
                        h.setCards(event.data.player.hands.cards || [])
                        player.setHands(h)
                        if (this.currentPlayer?.id === player.getId()) {
                            this.currentPlayer = player
                        }
                        if (this.nextPlayer?.id === player.getId()) {
                            this.nextPlayer = player
                        }
                    }
                    return player
                })
                this.deck.addCards(event.data.cards)
                break
            case event instanceof CardDrawn:
                this.players = this.players.map((player) => {
                    if (player.getId() === event.data.fromPlayer.id) {
                        const p = new Player(event.data.fromPlayer.id, event.data.fromPlayer.name)
                        const h = new Hands()
                        h.setCards(event.data.fromPlayer.hands.cards || [])
                        p.setHands(h)
                        if (this.currentPlayer?.id === p.getId()) {
                            this.currentPlayer = p
                        }
                        if (this.nextPlayer?.id === p.getId()) {
                            this.nextPlayer = p
                        }
                        return p
                    }
                    if (player.getId() === event.data.toPlayer.id) {
                        const p = new Player(event.data.toPlayer.id, event.data.toPlayer.name)
                        const h = new Hands()
                        h.setCards(event.data.toPlayer.hands.cards || [])
                        p.setHands(h)
                        if (this.currentPlayer?.id === p.getId()) {
                            this.currentPlayer = p
                        }
                        if (this.nextPlayer?.id === p.getId()) {
                            this.nextPlayer = p
                        }
                        return p
                    }
                    return player
                })
                this.currentPlayer = this.toCurrentPlayer(this.currentPlayer)
                this.nextPlayer = this.toNextPlayer(this.currentPlayer)
                this.round =
                    this.players[0].getId() === this.currentPlayer?.getId()
                        ? this.round + 1
                        : this.round
                break
            case event instanceof HandsCompleted:
                if (this.currentPlayer?.id === event.data.player.id) {
                    this.currentPlayer = this.toCurrentPlayer(this.currentPlayer)
                    this.nextPlayer = this.toNextPlayer(this.currentPlayer)
                } else if (this.nextPlayer?.id === event.data.player.id) {
                    this.nextPlayer = this.toNextPlayer(this.currentPlayer)
                }
                this.addFinishPlayer(event.data.player.id, event.data.player.name)
                break
            case event instanceof GameEnded:
                this.status = event.data.status
                break
        }
    }

    private addFinishPlayer(id: string, name: string) {
        this.finishedPlayers.push({
            id,
            name,
        })
    }

    private addPlayer(player: Player) {
        this.players.push(player)
    }

    private checkGameIsOver() {
        if (this.finishedPlayers.length === Game.MAX_PLAYERS - 1) {
            this.apply(
                new GameEnded({
                    id: this.id,
                    status: 'END',
                    ranking: this.players.map((player, index) => ({
                        playerId: this.finishedPlayers[index]?.id || player.getId(),
                        name: this.finishedPlayers[index]?.name || player.name,
                        rank: index + 1,
                    })),
                }),
            )
        }
    }

    private toCurrentPlayer(originCurrent: Player | null): Player | null {
        const beforeCurrent = this.players.findIndex(
            (player) => player.getId() === originCurrent?.getId(),
        )
        for (let i = 1; i < Game.MAX_PLAYERS; i++) {
            const current = (beforeCurrent + i) % Game.MAX_PLAYERS
            if (
                !this.finishedPlayers.some((player) => player.id === this.players[current].getId())
            ) {
                return this.players[current]
            }
        }
        return null
    }

    private toNextPlayer(originNext: Player | null): Player | null {
        const beforeNext = this.players.findIndex(
            (player) => player.getId() === originNext?.getId(),
        )
        for (let i = 1; i < Game.MAX_PLAYERS; i++) {
            const next = (beforeNext + i) % Game.MAX_PLAYERS
            if (!this.finishedPlayers.some((player) => player.id === this.players[next].getId())) {
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
