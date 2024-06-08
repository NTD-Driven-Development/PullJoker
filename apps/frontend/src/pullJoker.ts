import { Project } from 'paper/dist/paper-core';
import type { Client } from '@packages/socket';
import { Deck } from '~/src/deck';
import { DiscardPile } from '~/src/discardPile';
import { Hand } from '~/src/hand';
import _ from 'lodash';
import { io } from 'socket.io-client';
import type { GetGameResultEventSchema } from '@packages/domain';
import Queue from 'queue';

const SOCKET_HOST = 'localhost:3002';

export class PullJoker extends Project {
    playerId: string;
    gameId: string;
    socket: Client;
    game?: GetGameResultEventSchema['data'];
    isStarted: boolean = false;
    isDealing: boolean = false;
    currentPlayer?: string;
    nextPlayer?: string;
    hands: Map<string, Hand>;
    deck?: Deck;
    discardPile: DiscardPile;
    messageQueue: Queue = new Queue({ results: [] });

    constructor(canvas: HTMLCanvasElement, playerId: string, gameId: string) {
        super(canvas);

        this.playerId = playerId;
        this.gameId = gameId;
        this.discardPile = new DiscardPile(this.view.bounds.center);
        this.hands = new Map();

        const socket: Client = io(SOCKET_HOST, {
			reconnectionDelayMax: 0,
			reconnectionDelay: 0,
			forceNew: true,
			transports: ['websocket'],
            query: {
                playerId: playerId,
                playerName: 'name',
            },
		});
        
        this.socket = socket;

        this.startListen();
    }

    startListen = () => {
        this.socket.on('get-game-result', (event) => {
            if (event.data.players?.length == 4 && !this.isStarted) {
                this.socket.emit('start-game', {
                    type: 'start-game',
                    data: {
                        gameId: this.gameId,
                    },
                })
            }
        });

        this.socket.on('game-started', async (event) => {
            this.messageQueue.push(async (cb) => {
                if (this.isStarted)
                    return;
    
                this.isStarted = true;

                const players = event.data.players;
                const index = players.findIndex((v) => v.id == this.playerId);

                if (index > -1) {
                    const subPlayers = players.splice(index, players.length - index);
                    players.unshift(...subPlayers);
                }

                _.each(players, (player, index) => {
                    const hand = new Hand();
                    const startPosition = this.view.bounds.bottomCenter.add([0, -hand.bounds.height / 2]);

                    if (this.playerId == player.id) {
                        hand.position = startPosition;
                    }
                    else {
                        const angle = 360 / players.length * index;
                        hand.position = startPosition.rotate(angle, this.view.bounds.center);
                        hand.rotate(angle);
                    }

                    this.hands.set(player.id, hand);
                });

                this.deck = await Deck.make(this.view.bounds.center, 53);
                await this.deck.shuffle(10, { time: 0.2 });

                cb?.(undefined, undefined);
            });
        });

        this.socket.on('card-dealt', async (evnet) => {
            this.messageQueue.push(async (cb) => {
                const players = evnet.data.players;

                for (const i of _.range(0, 53)) {
                    const player = players[i % 4];
                    const hand = this.hands.get(player.id)!;

                    const card = await this.deck?.deal(hand)!;
                    
                    if (player.id == this.playerId) {
                        const { suit, rank } = player.hands.cards?.[hand.cards.length - 1]!;
                        suit == 'CLUBS' && (card.cardType = 1);
                        suit == 'HEARTS' && (card.cardType = 2);
                        suit == 'SPADES' && (card.cardType = 3);
                        suit == 'DIAMONDS' && (card.cardType = 4);
                        suit == 'JOKER' && (card.cardType = 5);
                        rank == 'A' && (card.cardNo = 1);
                        rank == '2' && (card.cardNo = 2);
                        rank == '3' && (card.cardNo = 3);
                        rank == '4' && (card.cardNo = 4);
                        rank == '5' && (card.cardNo = 5);
                        rank == '6' && (card.cardNo = 6);
                        rank == '7' && (card.cardNo = 7);
                        rank == '8' && (card.cardNo = 8);
                        rank == '9' && (card.cardNo = 9);
                        rank == '10' && (card.cardNo = 10);
                        rank == 'J' && (card.cardNo = 11);
                        rank == 'Q' && (card.cardNo = 12);
                        rank == 'K' && (card.cardNo = 13);
                        rank == 'JOKER_1' && (card.cardNo = 1);
                        rank == 'JOKER_2' && (card.cardNo = 2);
                        
                        card.faceDown = false;
                    }
                }

                cb?.(undefined, undefined);
            });
        });

        this.socket.on('card-played', (event) => {
            this.messageQueue.push(async (cb) => {
                const hand = this.hands.get(event.data.player.id);
                const idxes = event.data.cards.map((v) => v.index);
                const cards = await hand?.play(this.discardPile, idxes);
                
                _.forEach(cards, (card, index) => {
                    const { suit, rank } = event.data.cards[index];
                    suit == 'CLUBS' && (card.cardType = 1);
                    suit == 'HEARTS' && (card.cardType = 2);
                    suit == 'SPADES' && (card.cardType = 3);
                    suit == 'DIAMONDS' && (card.cardType = 4);
                    suit == 'JOKER' && (card.cardType = 5);
                    rank == 'A' && (card.cardNo = 1);
                    rank == '2' && (card.cardNo = 2);
                    rank == '3' && (card.cardNo = 3);
                    rank == '4' && (card.cardNo = 4);
                    rank == '5' && (card.cardNo = 5);
                    rank == '6' && (card.cardNo = 6);
                    rank == '7' && (card.cardNo = 7);
                    rank == '8' && (card.cardNo = 8);
                    rank == '9' && (card.cardNo = 9);
                    rank == '10' && (card.cardNo = 10);
                    rank == 'J' && (card.cardNo = 11);
                    rank == 'Q' && (card.cardNo = 12);
                    rank == 'K' && (card.cardNo = 13);
                    rank == 'JOKER_1' && (card.cardNo = 1);
                    rank == 'JOKER_2' && (card.cardNo = 2);

                    card.faceDown = false;
                });

                // if (event.data.nextPlayer?.id)
                // this.socket.emit('draw-card', {
                //     type: 'draw-card',
                // });

                cb?.(undefined, undefined);
            });
        });

        this.socket.on('card-drawn', (event) => {
            this.messageQueue.push(async (cb) => {
                const fromHand = this.hands.get(event.data.fromPlayer.id)!;
                const toHand = this.hands.get(event.data.toPlayer.id)!;
                const cards = await toHand?.drawCard(fromHand, [event.data.cardIndex]);
                
                _.forEach(cards, (card, index) => {
                    const { suit, rank } = event.data.card!;
                    suit == 'CLUBS' && (card.cardType = 1);
                    suit == 'HEARTS' && (card.cardType = 2);
                    suit == 'SPADES' && (card.cardType = 3);
                    suit == 'DIAMONDS' && (card.cardType = 4);
                    suit == 'JOKER' && (card.cardType = 5);
                    rank == 'A' && (card.cardNo = 1);
                    rank == '2' && (card.cardNo = 2);
                    rank == '3' && (card.cardNo = 3);
                    rank == '4' && (card.cardNo = 4);
                    rank == '5' && (card.cardNo = 5);
                    rank == '6' && (card.cardNo = 6);
                    rank == '7' && (card.cardNo = 7);
                    rank == '8' && (card.cardNo = 8);
                    rank == '9' && (card.cardNo = 9);
                    rank == '10' && (card.cardNo = 10);
                    rank == 'J' && (card.cardNo = 11);
                    rank == 'Q' && (card.cardNo = 12);
                    rank == 'K' && (card.cardNo = 13);
                    rank == 'JOKER_1' && (card.cardNo = 1);
                    rank == 'JOKER_2' && (card.cardNo = 2);

                    card.faceDown = false;
                });

                cb?.(undefined, undefined);
            });
        });

        this.socket.emit('join-room', {
            type: 'join-room',
            data: {
                gameId: this.gameId,
            },
        });

        this.messageQueue.concurrency = 1;
        this.messageQueue.autostart = true;
    }
}