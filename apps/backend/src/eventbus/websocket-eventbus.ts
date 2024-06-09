import {
    CardDealt,
    CardDrawn,
    CardPlayed,
    DomainEvent,
    GameEnded,
    GameStarted,
    GetGameResult,
    HandsCompleted,
    PlayerJoinedRoom,
} from '@packages/domain'
import { EventBus } from '~/eventbus/eventbus'
import { Server } from '@packages/socket'
import { autoInjectable, inject } from 'tsyringe'
import { Socket } from 'socket.io'
import { SendGameEndedFeatureToggle } from '~/feature-toggle'
import axios from 'axios'

@autoInjectable()
export class WebSocketEventBus implements EventBus {
    private readonly socket: Server
    private readonly server: Server

    public constructor(@inject(Socket) socket: Server, @inject('ServerSocket') server: Server) {
        this.socket = socket
        this.server = server
    }

    public broadcast(events: DomainEvent[]) {
        events.forEach((event) => {
            this.handle(event)
        })
    }

    private async handle(event: DomainEvent) {
        console.log('event', event.getType())
        switch (true) {
            case event instanceof PlayerJoinedRoom: {
                const payload = {
                    type: 'player-joined-room' as const,
                    data: {
                        gameId: event.data.id,
                        player: {
                            id: event.data.player.getId(),
                            name: event.data.player.name,
                        },
                    },
                }
                this.socket.join(event.data.id)
                this.socket.in(event.data.id).emit('player-joined-room', payload)
                this.socket.emit('player-joined-room', payload)
                this.socket.auth = {
                    user: {
                        id: event.data.player.getId(),
                        name: event.data.player.name,
                        gameId: event.data.id,
                    },
                }
                break
            }
            case event instanceof GameStarted: {
                const payload = {
                    type: 'game-started' as const,
                    data: {
                        gameId: event.data.id,
                        round: event.data.round,
                        players: event.data.players.map((player) => ({
                            id: player.getId(),
                            name: player.name,
                        })),
                        status: event.data.status,
                    },
                }
                this.socket.in(event.data.id).emit('game-started', payload)
                this.socket.emit('game-started', payload)
                break
            }
            case event instanceof CardDealt: {
                event.data.players.forEach((EventClient) => {
                    this.server.to(EventClient.id).emit('card-dealt', {
                        type: 'card-dealt' as const,
                        data: {
                            gameId: event.data.id,
                            round: event.data.round,
                            deck: { cards: event.data.deck.cards },
                            currentPlayer: event.data.currentPlayer,
                            nextPlayer: event.data.nextPlayer,
                            players: event.data.players.map((player) => {
                                const isMe = player.id === EventClient.id
                                const cards = player.hands.cards || []
                                return {
                                    id: player.id,
                                    name: player.name,
                                    hands: {
                                        cards: isMe ? cards : undefined,
                                        cardCount: cards.length,
                                    },
                                }
                            }),
                        },
                    })
                })
                break
            }
            case event instanceof CardPlayed: {
                const allPlayers = await this.server.in(event.data.id).fetchSockets()
                const player = event.data.player
                const cards = player.hands.cards || []
                allPlayers.map((socketClient) => {
                    const isMe = socketClient.rooms.has(player.id)
                    const payload = {
                        type: 'card-played' as const,
                        data: {
                            gameId: event.data.id,
                            player: {
                                id: player.id,
                                name: player.name,
                                hands: {
                                    cards: isMe ? cards : undefined,
                                    cardCount: cards.length,
                                },
                            },
                            cards: event.data.cards,
                        },
                    }
                    this.server.in(socketClient.id).emit('card-played', payload)
                })
                break
            }
            case event instanceof CardDrawn: {
                const allPlayers = await this.server.in(event.data.id).fetchSockets()
                const fromPlayer = event.data.fromPlayer
                const toPlayer = event.data.toPlayer
                const fromPlayerCards = fromPlayer.hands.cards || []
                const toPlayerCards = toPlayer.hands.cards || []
                allPlayers.map((socketClient) => {
                    const isMe = socketClient.rooms.has(toPlayer.id) || socketClient.rooms.has(fromPlayer.id)
                    const payload = {
                        type: 'card-drawn' as const,
                        data: {
                            card: event.data.card,
                            cardIndex: event.data.cardIndex,
                            fromPlayer: {
                                id: fromPlayer.id,
                                name: fromPlayer.name,
                                hands: {
                                    cards: isMe ? fromPlayerCards : undefined,
                                    cardCount: fromPlayerCards.length,
                                },
                            },
                            toPlayer: {
                                id: toPlayer.id,
                                name: toPlayer.name,
                                hands: {
                                    cards: isMe ? toPlayerCards : undefined,
                                    cardCount: toPlayerCards.length,
                                },
                            },
                        },
                    }
                    this.server.in(socketClient.id).emit('card-drawn', payload)
                })
                break
            }
            case event instanceof HandsCompleted: {
                const payload = {
                    type: 'hands-completed' as const,
                    data: {
                        gameId: event.data.id,
                        playerId: event.data.player.id,
                        ranking: event.data.ranking,
                    },
                }
                this.server.in(event.data.id).emit('hands-completed', payload)
                break
            }
            case event instanceof GameEnded: {
                const payload = {
                    type: 'game-ended' as const,
                    data: {
                        id: event.data.id,
                        status: event.data.status,
                        ranking: event.data.ranking,
                    },
                }
                this.server.in(event.data.id).emit('game-ended', payload)
                if (SendGameEndedFeatureToggle.isEnabled()) {
                    axios.post(`${process.env.LOBBY_BACKEND_URL}/api/rooms/gameEnd`, {
                        gameUrl: `${process.env.FRONTEND_URL}?gameId=${event.data.id}`,
                    })
                }
                break
            }
            case event instanceof GetGameResult: {
                event.data.players.forEach((EventClient) => {
                    this.server.to(EventClient.id).emit('get-game-result', {
                        type: 'get-game-result' as const,
                        data: {
                            ...event.data,
                            players: event.data.players.map((player) => {
                                const isMe = player.id === EventClient.id
                                const cards = player.hands?.cards
                                return {
                                    id: player.id,
                                    name: player.name,
                                    hands: {
                                        cards: isMe ? cards : undefined,
                                        cardCount: player.hands?.cardCount,
                                    },
                                }
                            }),
                        },
                    })
                })
                break
            }
            default:
                throw new Error(`Unsupported event: ${event.constructor.name}`)
        }
    }
}
