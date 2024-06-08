/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from '@packages/domain'
import { Client } from '@packages/socket'
import io from 'socket.io-client'
import app = require('supertest')

const api = app.agent(globalThis.SERVER_URL)
describe('e2e on game-controller', () => {
    beforeAll((done) => {
        setTimeout(() => {
            api.get('/api/health').then(() => {
                done()
            })
        }, 1000)
    })

    afterEach(() => {})

    it(`
        平台向伺服器發送開始遊戲房間的請求，
        伺服器回應遊戲的 URL 和 ID，
        並且 A, B, C, D 四位玩家加入遊戲
        玩家 D 發起開始遊戲的請求，
        遊戲已開始，玩家 A, B, C, D 收到遊戲開始的事件與發牌事件。
        玩家 A, B, C, D 收到出牌事件，且每位玩家擁有的手牌數量皆大於等於 0。
        目前玩家 B(Next) 向玩家 A(Current) 抽左手邊第一張牌，並且玩家 A, B 收到抽牌事件。
        依序由 C > D > A > B 抽牌，若玩家手牌數量為 0 則接收到手牌完成事件。
        直到只剩下一位玩家，則遊戲結束。

    `, async () => {
        const response = await api.post('/api/startGame')
        expect(response.body).toHaveProperty('gameUrl')
        expect(response.body).toHaveProperty('gameId')
        const gameId = response.body.gameId

        const { clientA, clientB, clientC, clientD } = givenFourPlayers()

        // Client A, B, C, D join the game
        await joinRoom(clientA, gameId)
        await joinRoom(clientB, gameId)
        await joinRoom(clientC, gameId)
        await joinRoom(clientD, gameId)

        await Promise.all([
            // Client D starts the game,
            startGame(clientD, gameId),
            // All players receive the game-started
            gameStarted(clientA, gameId),
            gameStarted(clientB, gameId),
            gameStarted(clientC, gameId),
            gameStarted(clientD, gameId),
            // All players receive the card-dealt event
            cardDealt(clientA, gameId),
            cardDealt(clientB, gameId),
            cardDealt(clientC, gameId),
            cardDealt(clientD, gameId),
            // All players receive the card-played event, and owner can see the cards in their hands
            cardPlayed(clientA, gameId),
            cardPlayed(clientB, gameId),
            cardPlayed(clientC, gameId),
            cardPlayed(clientD, gameId),
        ])

        await Promise.all([
            // B draws a card from A
            cardDrawn(clientB, gameId, clientA),
            [cardDrawnToPlayer(clientB, clientA), cardDrawnFromPlayer(clientA, clientB)],
        ])

        await new Promise((resolve) => setTimeout(resolve, 500))
        const players = [clientB, clientC, clientD, clientA]
        const finishedPlayers: string[] = []
        let currentPlayer = clientB
        let nextPlayer: Client = clientC
        let rank = 1
        clientA.on('hands-completed', (event) => {
            expect(event.data.ranking).toBe(rank)
            rank++
            finishedPlayers.push(event.data.playerId)
        })
        clientA.once('game-ended', (event) => {
            expect(event.data.ranking.length).toBe(4)
        })
        while (true) {
            const playerCount = players.length
            const cp = currentPlayer
            const np = nextPlayer

            await Promise.all([
                // C draws a card from B
                cardDrawn(np, gameId, cp),
                [cardDrawnToPlayer(np, cp), cardDrawnFromPlayer(cp, np)],
            ])

            currentPlayer = toCurrentPlayer(cp, players, playerCount, finishedPlayers) as Client
            nextPlayer = toNextPlayer(currentPlayer, players, playerCount, finishedPlayers) as Client
            if (finishedPlayers.length === playerCount - 1 || currentPlayer === null || nextPlayer === null) {
                break
            } else {
                await new Promise((resolve) => setTimeout(resolve, 10))
            }
        }
    })
})

function toCurrentPlayer(originCurrent: Client, players: Client[], playerCount: number, finishedPlayers: string[]) {
    const beforeCurrent = players.findIndex(
        (player) => (player.auth as { [key: string]: any })?.id === (originCurrent.auth as { [key: string]: any })?.id,
    )
    for (let i = 1; i < playerCount; i++) {
        const current = (beforeCurrent + i) % playerCount
        if (!finishedPlayers.includes((players[current]?.auth as { [key: string]: any })?.id)) {
            return players[current]
        }
    }
    return null
}

function toNextPlayer(originNext: Client, players: Client[], playerCount: number, finishedPlayers: string[]) {
    const beforeNext = players.findIndex(
        (player) => (player.auth as { [key: string]: any })?.id === (originNext?.auth as { [key: string]: any })?.id,
    )
    for (let i = 1; i < playerCount; i++) {
        const next = (beforeNext + i) % playerCount
        if (!finishedPlayers.includes((players[next].auth as { [key: string]: any })?.id)) {
            return players[next]
        }
    }
    return null
}

function cardDrawn(to: Client, gameId: any, from: Client, cardIndex: number = 0): Promise<unknown> {
    return new Promise((resolve) => {
        to.once('card-drawn', resolve)
        to.emit('draw-card', {
            type: 'draw-card',
            data: { gameId, fromPlayerId: (from.auth as { [key: string]: any }).id, cardIndex: Math.floor(Math.random() * cardIndex) },
        })
    })
}

function cardDrawnToPlayer(to: Client, from: Client): Promise<number> {
    return new Promise((resolve) => {
        to.once('card-drawn', (event) => {
            const card = event.data.card as Card
            expect(event.data.toPlayer.id).toBe((to.auth as { [key: string]: any }).id)
            expect(event.data.fromPlayer.id).toBe((from.auth as { [key: string]: any }).id)
            expect(event.data.toPlayer.hands.cards?.find((c) => c.suit === card.suit && c.rank === card.rank) !== undefined).toBe(true)
            resolve(event.data.toPlayer.hands.cardCount)
        })
    })
}

function cardDrawnFromPlayer(from: Client, to: Client): Promise<number> {
    return new Promise((resolve) => {
        from.once('card-drawn', (event) => {
            const card = event.data.card as Card
            expect(event.data.toPlayer.id).toBe((to.auth as { [key: string]: any }).id)
            expect(event.data.fromPlayer.id).toBe((from.auth as { [key: string]: any }).id)
            expect(event.data.fromPlayer.hands.cards?.find((c) => c.suit === card.suit && c.rank === card.rank) === undefined).toBe(true)
            resolve(event.data.toPlayer.hands.cardCount)
        })
    })
}

async function cardPlayed(client: Client, gameId: string): Promise<number> {
    return new Promise((resolve) => {
        client.once('card-played', (event) => {
            const cards = event.data.cards as Card[]
            const player = event.data.player
            if (player.id === (client.auth as { [key: string]: any }).id) {
                expect(player.hands.cards?.length).toBeGreaterThanOrEqual(0)
                expect(player.hands.cards?.find((c) => cards.find((card) => card.suit === c.suit && card.rank === c.rank))).toBeUndefined()
            } else {
                expect(player.hands.cardCount).toBeGreaterThanOrEqual(0)
            }
            expect(event.data.gameId).toBe(gameId)
            expect(event.data.cards.length).toBe(2)
            resolve(player.hands.cardCount)
        })
    })
}

async function cardDealt(client: Client, gameId: string) {
    return new Promise((resolve) => {
        client.once('card-dealt', (event) => {
            event.data.players.forEach((player) => {
                if (player.id === (client.auth as { [key: string]: any }).id) {
                    expect(player?.hands?.cards?.length).toBeGreaterThanOrEqual(0)
                } else {
                    expect(player.hands.cardCount).toBeGreaterThanOrEqual(0)
                }
                expect(event.data.deck).toBeTruthy()
                expect(event.data.gameId).toBe(gameId)
                expect(event.data.round).toBe(1)
                expect(event.data.players.length).toBe(4)
                resolve(true)
            })
        })
    })
}

async function gameStarted(client: Client, gameId: string) {
    return new Promise((resolve) => {
        client.once('game-started', (event) => {
            expect(event.data.gameId).toBe(gameId)
            expect(event.data.round).toBe(1)
            expect(event.data.players.length).toBe(4)
            expect(event.data.status).toBe('PLAYING')
            resolve(true)
        })
    })
}

async function joinRoom(client: Client, gameId: string) {
    return new Promise((resolve) => {
        client.once('player-joined-room', resolve)
        client.emit('join-room', {
            type: 'join-room',
            data: { gameId },
        })
    })
}

async function startGame(client: Client, gameId: string) {
    return new Promise((resolve) => {
        client.once('game-started', resolve)
        client.emit('start-game', {
            type: 'start-game',
            data: { gameId },
        })
    })
}

function givenFourPlayers() {
    const clientA: Client = io(globalThis.SERVER_URL, {
        reconnectionDelayMax: 0,
        reconnectionDelay: 0,
        forceNew: true,
        transports: ['websocket'],
        auth: {
            id: 'A',
            name: 'A',
        },
    })
    const clientB: Client = io(globalThis.SERVER_URL, {
        reconnectionDelayMax: 0,
        reconnectionDelay: 0,
        forceNew: true,
        transports: ['websocket'],
        auth: {
            id: 'B',
            name: 'B',
        },
    })
    const clientC: Client = io(globalThis.SERVER_URL, {
        reconnectionDelayMax: 0,
        reconnectionDelay: 0,
        forceNew: true,
        transports: ['websocket'],
        auth: {
            id: 'C',
            name: 'C',
        },
    })
    const clientD: Client = io(globalThis.SERVER_URL, {
        reconnectionDelayMax: 0,
        reconnectionDelay: 0,
        forceNew: true,
        transports: ['websocket'],
        auth: {
            id: 'D',
            name: 'D',
        },
    })
    return { clientA, clientB, clientC, clientD }
}
