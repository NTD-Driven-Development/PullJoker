import { Project } from 'paper/dist/paper-core';
import { io } from 'socket.io-client';
import { toast, type ToastCloseHandle } from '~/src/notificator';
import { Deck } from '~/src/deck';
import { DiscardPile } from '~/src/discardPile';
import { Hand } from '~/src/hand';
import type { Client } from '@packages/socket';
import type { GetGameResultEventSchema } from '@packages/domain';
import Queue from 'queue';
import _ from 'lodash';

export class PullJoker extends Project {
    gameId: string;
    playerId: string;
    playerName: string;
    socket: Client;
    game?: GetGameResultEventSchema['data'];
    isDealing: boolean = false;
    hands: Map<string, Hand>;
    deck?: Deck;
    discardPile: DiscardPile;
    messageQueue: Queue = new Queue({ results: [] });
    waitPlayerJoinToastCloseHandle?: ToastCloseHandle;
    isYourTurnToastCloseHandle?: ToastCloseHandle;
    handCompletedToastCloseHandle?: ToastCloseHandle;
    endedToastCloseHandle?: ToastCloseHandle;

    constructor(canvas: HTMLCanvasElement, gameId: string, playerId: string, playerName: string = `player ${playerId}`) {
        super(canvas);

        if (canvas.clientWidth >= 700) {
            this.view.scale(1);
        }
        else {
            this.view.scale(0.5);
        }

        this.gameId = gameId;
        this.playerId = playerId;
        this.playerName = playerName;
        this.discardPile = new DiscardPile(this.view.bounds.center);
        this.hands = new Map();

        const config = useRuntimeConfig();

        const socket: Client = io(config.public.BACKEND_URL, {
			reconnectionDelayMax: 0,
			reconnectionDelay: 0,
			forceNew: true,
			transports: ['websocket'],
            query: {
                playerId: playerId,
                playerName: playerName,
            },
		});
        
        this.socket = socket;

        this.startListen();
    }

    startListen = () => {
        this.socket.on('get-game-result', (event) => {
            this.messageQueue.push(async (cb) => {
                if (this.isDealing || event.data.status == 'END')
                    return;

                if (this.playerId == event.data.nextPlayer?.id) {
                    const hand = this.hands.get(event.data.currentPlayer?.id!)!;

                    hand.beDraw = true;
                    hand.onDrawed = (index) => {
                        hand.beDraw = false;
                        this.socket.emit('draw-card', {
                            type: 'draw-card',
                            data: {
                                gameId: this.gameId,
                                cardIndex: index,
                                fromPlayerId: event.data.currentPlayer?.id!,
                            }
                        });
                    };

                    this.isYourTurnToastCloseHandle = toast('輪到你的回合了', this.view.center);
                }
                
                cb?.(undefined, undefined);
            });
        });

        this.socket.on('player-joined-room', (event) => {
            this.socket.emit('start-game', {
                type: 'start-game',
                data: {
                    gameId: this.gameId,
                },
            });

            this.waitPlayerJoinToastCloseHandle?.();
            this.waitPlayerJoinToastCloseHandle = toast('等待其他玩家加入中', this.view.center);
        });

        this.socket.on('game-started', async (event) => {
            this.messageQueue.push(async (cb) => {
                this.waitPlayerJoinToastCloseHandle?.();

                const players = event.data.players;
                const index = players.findIndex((v) => v.id == this.playerId);

                if (index > -1) {
                    const subPlayers = players.splice(index, players.length - index);
                    players.unshift(...subPlayers);
                }

                if (players.length == 2) {
                    const hand1 = new Hand();
                    hand1.position = this.view.bounds.bottomCenter.add([0, -hand1.bounds.height / 2]);

                    const hand2 = new Hand();
                    hand2.position = this.view.bounds.topCenter.add([0, hand1.bounds.height / 2]);

                    this.hands.set(players[0].id, hand1);
                    this.hands.set(players[1].id, hand2);
                }
                else if (players.length == 3) {
                    const hand1 = new Hand();
                    hand1.position = this.view.bounds.bottomCenter.add([0, -hand1.bounds.height / 2]);

                    const hand2 = new Hand();
                    hand2.position = this.view.bounds.leftCenter.add([hand1.bounds.height / 2, 0]);
                    hand2.rotate(90);

                    const hand3 = new Hand();
                    hand3.position = this.view.bounds.rightCenter.add([-hand1.bounds.height / 2, 0]);
                    hand3.rotate(270);
                    
                    this.hands.set(players[0].id, hand1);
                    this.hands.set(players[1].id, hand2);
                    this.hands.set(players[2].id, hand3);
                }
                else if (players.length == 4) {
                    const hand1 = new Hand();
                    hand1.position = this.view.bounds.bottomCenter.add([0, -hand1.bounds.height / 2]);

                    const hand2 = new Hand();
                    hand2.position = this.view.bounds.leftCenter.add([hand1.bounds.height / 2, 0]);
                    hand2.rotate(90);

                    const hand3 = new Hand();
                    hand3.position = this.view.bounds.topCenter.add([0, hand1.bounds.height / 2]);
                    hand3.rotate(180);

                    const hand4 = new Hand();
                    hand4.position = this.view.bounds.rightCenter.add([-hand1.bounds.height / 2, 0]);
                    hand4.rotate(270);
                    
                    this.hands.set(players[0].id, hand1);
                    this.hands.set(players[1].id, hand2);
                    this.hands.set(players[2].id, hand3);
                    this.hands.set(players[3].id, hand4);
                }

                this.deck = await Deck.make(this.view.bounds.center, 53);
                await this.deck.shuffle(10, { time: 0.2 });

                cb?.(undefined, undefined);
            });
        });

        this.socket.on('card-dealt', async (evnet) => {
            this.messageQueue.push(async (cb) => {
                this.isDealing = true;
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

                this.isDealing = false;

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

                cb?.(undefined, undefined);
            });
        });

        this.socket.on('card-drawn', (event) => {
            this.messageQueue.push(async (cb) => {
                const fromHand = this.hands.get(event.data.fromPlayer.id)!;
                const toHand = this.hands.get(event.data.toPlayer.id)!;

                this.isYourTurnToastCloseHandle?.();

                await toHand?.drawCard(fromHand, [event.data.cardIndex], {
                    onCardAtCenter: (cards) => {
                        if (event.data.toPlayer.id != this.playerId)
                            return;

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
                    },

                    onAnimated: (cards) => {
                        if (event.data.toPlayer.id == this.playerId)
                            return;

                        _.forEach(cards, (card, index) => {
                            card.faceDown = true;
                        });
                    },
                });

                cb?.(undefined, undefined);
            });
        });

        this.socket.on('hands-completed', (event) => {
            this.messageQueue.push(async (cb) => {
                if (event.data.playerId != this.playerId)
                    return;

                this.handCompletedToastCloseHandle = toast('你已空手，觀戰中。', this.view.center);

                cb?.(undefined, undefined);
            });
        });

        this.socket.on('game-ended', (event) => {
            this.messageQueue.push(async (cb) => {
                const txt = _.reduce(event.data.ranking, (txt, v) => {
                    return txt += `第${v.rank}名：${v.name}${v.rank != 4 ? '\n' : ''}`
                }, '');
                
                this.handCompletedToastCloseHandle?.();
                this.endedToastCloseHandle = toast(`遊戲結束。\n排名：\n${txt}`, this.view.center);

                const loserHand = this.hands.get(_.find(event.data.ranking, (v) => v.rank == 4)?.playerId!)!;
                loserHand.cards[0].faceDown = false;
                loserHand.cards[0].cardType = 5;
                loserHand.cards[0].cardNo = 1;

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