/* eslint-disable @typescript-eslint/no-explicit-any */
import {} from '@packages/domain'
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
        玩家 A, B, C, D 收到出牌事件，且每位玩家擁有的手牌數量皆大於等於 0
        
    `, async () => {
        const response = await api.post('/api/games/startGame')
        expect(response.body).toHaveProperty('gameUrl')
        expect(response.body).toHaveProperty('gameId')
        const gameId = response.body.gameId

        const { clientA, clientB, clientC, clientD } = givenFourPlayers()

        await Promise.all([
            // Client A, B, C, D join the game
            joinRoom(clientA, gameId),
            joinRoom(clientB, gameId),
            joinRoom(clientC, gameId),
            joinRoom(clientD, gameId),
        ])

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
    })
})

async function cardPlayed(client: Client, gameId: string) {
    return new Promise((resolve) => {
        client.once('card-played', (event) => {
            if (event.data.player.id === (client.auth as { [key: string]: any }).id) {
                expect(event.data.player.hands.cards?.length).toBeGreaterThanOrEqual(0)
            } else {
                expect(event.data.player.hands.cardCount).toBeGreaterThanOrEqual(0)
            }
            expect(event.data.gameId).toBe(gameId)
            expect(event.data.cards.length).toBe(2)
            resolve(true)
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
