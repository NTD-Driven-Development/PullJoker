import { Project } from 'paper/dist/paper-core';
import { Deck } from '~/src/deck';
import { DiscardPile } from '~/src/discardPile';
import { Hand } from '~/src/hand';
import _ from 'lodash';
import { toast } from './notificator';

export class PullJoker extends Project {
    deck?: Deck;
    hands: Map<string, Hand>;
    discardPile: DiscardPile;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);

        if (canvas.clientWidth >= 700) {
            this.view.scale(1);
        }
        else {
            this.view.scale(0.5);
        }

        // const data = [
        //     {
        //         "playerId": "3",
        //         "name": "name",
        //         "rank": 1
        //     },
        //     {
        //         "playerId": "c8754ed4-a266-4a12-a780-3d86f5abaeec",
        //         "name": "name",
        //         "rank": 2
        //     },
        //     {
        //         "playerId": "1",
        //         "name": "name",
        //         "rank": 3
        //     },
        //     {
        //         "playerId": "3",
        //         "name": "name",
        //         "rank": 4
        //     }
        // ]

        // const txt = _.reduce(data, (txt, v) => {
        //     return txt += `第${v.rank}名：${v.name}${v.rank != 4 ? '\n' : ''}`
        // }, '');

        // toast(`遊戲結束`, this.view.center);

        this.discardPile = new DiscardPile(this.view.bounds.center);

        this.hands = new Map();

        const hand1 = new Hand();
        hand1.beDraw = true;
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
        
        this.hands.set('han1', hand1);
        this.hands.set('hand2', hand2);
        this.hands.set('hand3', hand3);
        this.hands.set('hand4', hand4);

        Deck.makeFullDeck(this.view.bounds.center)
        .then(async (deck) => {
            this.deck = deck;
            
            await this.deck.shuffle(10, { time: 0.2 });
            
            for (const i of _.range(0, this.deck.cards.length)) {
                if (i % 4 == 0)
                    await this.deck.deal(hand1);
                else if (i % 4 == 1)
                    await this.deck.deal(hand2);
                else if (i % 4 == 2)
                    await this.deck.deal(hand3);
                else if (i % 4 == 3)
                    await this.deck.deal(hand4);
            }

            this.deck.remove();

            while (true) {
                await hand2.drawCard(hand1, _.sampleSize(_.range(hand1.cards.length - 1), 5), {
                    onCardAtCenter: async (cards) => {
                        _.each(cards, (v) => {
                            v.faceDown = false;
                        });
                    },
                });
                // await hand2.play(this.discardPile, [0, 1]);
                await hand3.drawCard(hand2, _.sampleSize(_.range(hand2.cards.length - 1), 5), {
                    onCardAtCenter: async (cards) => {
                        _.each(cards, (v) => {
                            v.faceDown = false;
                        });
                    },
                });
                // await hand3.play(this.discardPile, [0, 1]);
                await hand4.drawCard(hand3, _.sampleSize(_.range(hand3.cards.length - 1), 5), {
                    onCardAtCenter: async (cards) => {
                        _.each(cards, (v) => {
                            v.faceDown = false;
                        });
                    },
                });
                // await hand4.play(this.discardPile, [0, 1]);
                await hand1.drawCard(hand4, _.sampleSize(_.range(hand4.cards.length - 1), 5), {
                    onCardAtCenter: async (cards) => {
                        _.each(cards, (v) => {
                            v.faceDown = false;
                        });
                    },
                });
                // await hand1.play(this.discardPile, [0, 1]);

            }

            // this.deck.remove();

            // while (true) {
            //     await hand1.play(this.discardPile, [0, 1]);
            //     await hand2.play(this.discardPile, [0, 1, 2, 3, 4]);
            //     await hand3.play(this.discardPile, [0, 1]);
            //     await hand4.play(this.discardPile, [0, 1]);
            // }
        });

        this.view.onResize = ({ delta }: { delta: paper.Size, size: paper.Size }) => {
            // this.discardPile.position = this.discardPile.position.add(delta.multiply(0.5));
            
            // if (this.deck) {
            //     this.deck.position = this.deck.position.add(delta.multiply(0.5));
            // }

            // this.hands.forEach((v) => {
            //     v.position = v.position.add(delta.multiply(0.5));
            // });
        }
    }
}