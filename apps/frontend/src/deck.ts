import { Point, Group, Rectangle, Color, Path } from 'paper/dist/paper-core';
import { Power2 } from 'gsap';
import { Card } from '~/src/card';
import type { Hand } from '~/src/hand';
import _ from 'lodash';

const SHUFFLE_OFFSET = 150;

export class Deck extends Group {
    cards: Card[] = [];
    private pushingAnimators: PushingAnimator[] = [];
    private shufflingAnimators: ShufflingAnimator[] = [];
    private dealingAnimators: DealingAnimator[] = [];

    constructor() {
        super();

        this.applyMatrix = false;

        const border = new Path.Rectangle(new Rectangle(0, 0, 400, 400));
        this.addChild(border);

        this.onFrame = this.frame;
    }

    push = async (card: Card, options?: PushingOptions) => new Promise((resolve, reject) => {
        const animator = new PushingAnimator(card, this, options);
        animator.onAnimated = () => {
            _.remove(this.pushingAnimators, (v) => v == animator);

            resolve(true);
        };
        this.pushingAnimators.push(animator);
    });

    shuffle = async (count: number, options?: Partial<ShufflingOptions>) => new Promise((resolve, reject) => {
        if (count == 0)
            return resolve(true);

        const swaps = _.sampleSize(_.range(0, this.cards.length), 2);
        
        const animator = new ShufflingAnimator(this, swaps[0], swaps[1], options);
        animator.onAnimated = async () => {
            await this.shuffle(count - 1, options);
            return resolve(true);
        };
        this.shufflingAnimators.push(animator);
    })

    deal = async (hand: Hand) => new Promise((resolve, reject) => {
        if (!this.cards.length)
            throw '牌堆無可用卡牌';

        const animator = new DealingAnimator(hand, this, this.cards.length - 1);
        animator.onAnimated = () => {
            _.remove(this.dealingAnimators, (v) => v == animator);
            return resolve(true);
        };

        this.dealingAnimators.push(animator);
    });

    static makeFullDeck = async (position: paper.Point) => {
        const deck = new Deck();
        deck.position = position;

        for (const type of _.range(4)) {
            for (const no of _.range(13)) {
                const count = deck.cards.length;

                const card = new Card();
                card.position = deck.bounds.center.add([count / 3, count / -1]);
                card.cardType = type + 1;
                card.cardNo = no + 1;
                card.faceDown = true;
                await deck.push(card, { time: 0.01 });
                await new Promise((r) => setTimeout(r, 20));
            }
        }

        for (const no of _.range(2)) {    
            const count = deck.cards.length;

            const card = new Card();
            card.position = deck.bounds.center.add([count / 3, count / -1])
            card.cardType = 5;
            card.cardNo = no + 1;
            card.faceDown = true;
            await deck.push(card, { time: 0.01 });
            await new Promise((r) => setTimeout(r, 20));
        }

        return deck;
    }
    
    private frame = () => {
        this.strokeColor = new Color(1, 0, 0);

        _.each(this.pushingAnimators, (v) => {
            v?.moveNext();
        });
        _.each(this.shufflingAnimators, (v) => {
            v?.moveNext();
        });
        _.each(this.dealingAnimators, (v) => {
            v?.moveNext();
        });
    }
}

class PushingAnimator {
    private card: Card;
    private deck: Deck;
    private currentStep: number;
    private steps: number[];
    private checkPoint: paper.Point;
    private tempCheckPoint?: paper.Point;
    private diffVector: paper.Point;
    private options: PushingOptions;

    onAnimated?: () => void;

    constructor(card: Card, deck: Deck, options?: Partial<PushingOptions>) {
        this.card = card;
        this.deck = deck;
        this.checkPoint = this.deck.localToGlobal(this.deck.bounds.center.subtract(this.deck.bounds.point));
        this.diffVector = new Point(0, 0);
        this.options = _.defaults(options, { time: 1 });
        this.currentStep = 0;
        this.steps = [];
    }

    moveNext = () => {
        if (this.currentStep == this.steps.length - 1) {
            return;
        }

        if (!this.tempCheckPoint || !this.checkPoint.subtract(this.tempCheckPoint).ceil().equals([0, 0])) {
            this.calcSteps();
            this.calcDiffVector();

            this.tempCheckPoint = this.checkPoint;
            this.checkPoint = this.deck.localToGlobal(this.deck.bounds.center.subtract(this.deck.bounds.point));
        }

        const diff = this.steps[this.currentStep + 1] - this.steps[this.currentStep];

        this.card.position = this.card.position.add(this.diffVector.multiply(diff));
        this.card.rotate(-this.card.rotation * diff);

        this.currentStep += 1;

        if (this.currentStep == this.steps.length - 1) {
            this.card.position = this.deck.globalToLocal(this.card.bounds.center);
            this.deck.cards.push(this.card);

            this.deck.addChild(this.card);
            this.onAnimated?.();
        }
    }

    private calcSteps = () => {
        const steps = Math.round(this.options.time * 1000 / 16.66);
        const diffSteps = steps - (this.currentStep ?? 0);

        this.steps = [];
        this.currentStep = 0;
        
        for (let i = 0; i <= diffSteps; i++) {            
            let progress = i / diffSteps;
            let easedProgress = Power2.easeInOut(progress);
            this.steps.push(easedProgress);
        }
    }

    private calcDiffVector = () => {
        const count = this.deck.cards.length;
        const cardGlobalCenter = this.card.localToGlobal(this.card.bounds.center.subtract(this.card.bounds.point));
        const deckGlobalCenter = this.deck.localToGlobal(this.deck.bounds.center.subtract(this.deck.bounds.point).add([count / 3, count / -1]));

        this.diffVector = cardGlobalCenter.subtract(deckGlobalCenter);
    }
}

class ShufflingAnimator {
    private deck: Deck;
    private currentForwardStep: number;
    private forwardSteps: number[];
    private currentBackStep: number;
    private backSteps: number[];
    private fromIdx: number;
    private toIdx: number;
    private fromCard: Card;
    private toCard: Card;
    private fromDefaultPoint: paper.Point;
    private toDefaultPoint: paper.Point;
    private options: ShufflingOptions;

    onAnimated?: () => void;

    constructor(deck: Deck, fromIdx: number, toIdx: number, options?: Partial<ShufflingOptions>) {
        this.deck = deck;
        this.currentForwardStep = 0;
        this.forwardSteps = [];
        this.currentBackStep = 0;
        this.backSteps = [];
        this.fromIdx = fromIdx;
        this.toIdx = toIdx;
        this.fromCard = deck.cards.slice(fromIdx)[0];
        this.toCard = deck.cards.slice(toIdx)[0];
        this.fromDefaultPoint = this.fromCard.position;
        this.toDefaultPoint = this.toCard.position;
        this.options = _.defaults(options, { time: 1 });

        if (this.fromIdx == this.toIdx)
            throw('from 及 to 須為不同值');

        this.calcSteps();
    }

    moveNext = () => {
        if (this.currentForwardStep < this.forwardSteps.length - 1) {
            const diff = this.forwardSteps[this.currentForwardStep + 1] - this.forwardSteps[this.currentForwardStep];

            this.fromCard.position = this.fromCard.position.add(new Point([-SHUFFLE_OFFSET, 0]).multiply(diff));
            this.toCard.position = this.toCard.position.add(new Point([SHUFFLE_OFFSET, 0]).multiply(diff));
            
            this.currentForwardStep += 1;

            if (this.currentForwardStep == this.forwardSteps.length - 1) {
                if (this.fromIdx > this.toIdx) {
                    const card = this.deck.cards.slice(this.fromIdx - 1)[0];
                    this.fromCard.insertBelow(this.toCard);
                    this.toCard.insertAbove(card);
                }
                else {
                    const card = this.deck.cards.slice(this.toIdx - 1)[0];
                    this.toCard.insertBelow(this.fromCard);
                    this.fromCard.insertAbove(card);
                }

                const temp = this.deck.cards[this.fromIdx];
                this.deck.cards[this.fromIdx] = this.deck.cards[this.toIdx];
                this.deck.cards[this.toIdx] = temp;
            }
        }
        else if (this.currentBackStep < this.backSteps.length - 1) {
            const diff = this.backSteps[this.currentBackStep + 1] - this.backSteps[this.currentBackStep];

            this.fromCard.position = this.fromCard.position.add(new Point([SHUFFLE_OFFSET, 0]).add(this.toDefaultPoint.subtract(this.fromDefaultPoint)).multiply(diff));
            this.toCard.position = this.toCard.position.add(new Point([-SHUFFLE_OFFSET, 0]).add(this.fromDefaultPoint.subtract(this.toDefaultPoint)).multiply(diff));
            
            this.currentBackStep += 1;

            if (this.currentBackStep == this.backSteps.length - 1) {
                this.onAnimated?.();
            }
        }
    }

    private calcSteps = () => {
        const totalSteps = Math.round(this.options.time * 1000 / 16.66);
        const diffForwardSteps = totalSteps / 2 - (this.currentForwardStep ?? 0);
        const diffBackSteps = totalSteps / 2 - (this.backSteps.length ?? 0);

        this.forwardSteps = [];
        this.currentForwardStep = 0;
        this.backSteps = [];
        this.currentBackStep = 0;

        for (let i = 0; i <= diffForwardSteps; i++) {
            let progress = i / diffForwardSteps;
            let easedProgress = Power2.easeInOut(progress);
            this.forwardSteps.push(easedProgress);
        }

        for (let i = 0; i <= diffBackSteps; i++) {            
            let progress = i / diffBackSteps;
            let easedProgress = Power2.easeInOut(progress);
            this.backSteps.push(easedProgress);
        }
    }
}

class DealingAnimator {
    private hand: Hand;
    private deck: Deck;
    private card: Card;
    private currentStep: number;
    private steps: number[];
    private checkPoint: paper.Point;
    private tempCheckPoint?: paper.Point;
    private diffConfig?: DiffConfig;
    private options: DealingOptions;

    onAnimated?: () => void;

    constructor(hand: Hand, deck: Deck, idx: number, options?: DealingOptions) {
        this.hand = hand;
        this.deck = deck;
        this.card = deck.cards[idx];
        this.checkPoint = this.hand.localToGlobal(this.hand.bounds.center.subtract(this.hand.bounds.point));
        this.options = options ?? { time: 0.2 };
        this.currentStep = 0;
        this.steps = [];
    }

    moveNext = () => {
        if (this.currentStep == this.steps.length - 1) {
            return;
        }

        if (!this.tempCheckPoint || !this.checkPoint.subtract(this.tempCheckPoint).ceil().equals([0, 0])) {
            this.calcSteps();
            this.calcDiffVector();

            this.tempCheckPoint = this.checkPoint;
            this.checkPoint = this.hand.localToGlobal(this.hand.bounds.center.subtract(this.hand.bounds.point));
        }

        const diff = this.steps[this.currentStep + 1] - this.steps[this.currentStep];
        const r = this.diffConfig!.toPoint.subtract(this.diffConfig!.fromPoint).rotate(-this.deck.rotation, [0, 0]);

        _.each(this.hand.cards, (v) => {
            v.position = v.position.subtract([15 * diff, 0]);
        });
        this.card.position = this.card.position.add(r.multiply(diff));
        this.card.rotate((this.hand.rotation - this.deck.rotation) * diff);

        this.currentStep += 1;

        if (this.currentStep == this.steps.length - 1) {
            this.card.rotate(-(this.hand.rotation - this.deck.rotation));
            this.card.position = this.hand.globalToLocal(this.diffConfig?.toPoint!);
            this.hand.cards.push(this.card);
            this.deck.cards.splice(this.deck.cards.findIndex((v) => v == this.card), 1);

            this.hand.addChild(this.card);
            this.onAnimated?.();
        }
    }

    private calcSteps = () => {
        const steps = Math.round((this.options?.time ?? 1) * 1000 / 16.66);
        const diffSteps = steps - (this.currentStep ?? 0);

        this.steps = [];
        this.currentStep = 0;
        
        for (let i = 0; i <= diffSteps; i++) {            
            let progress = i / diffSteps;
            let easedProgress = Power2.easeInOut(progress);
            this.steps.push(easedProgress);
        }
    }

    private calcDiffVector = () => {
        const handRotation = this.hand.rotation;
        this.hand.rotate(-handRotation);
        const handRect = this.hand.bounds;
        this.hand.rotate(handRotation);

        const count = this.hand.cards.length;
        const cardGlobalCenter = this.card.localToGlobal(this.card.bounds.center.subtract(this.card.bounds.point));
        const handTargetGlobalCenter = this.hand.localToGlobal(handRect.center.subtract(handRect.point).add([15 * count, 0]));

        this.diffConfig = {
            card: this.card,
            fromPoint: cardGlobalCenter,
            toPoint: handTargetGlobalCenter,
        }
    }
}

interface DiffConfig {
    card: Card,
    fromPoint: paper.Point,
    toPoint: paper.Point,
}

interface PushingOptions {
    time: number,
}

interface ShufflingOptions {
    time: number,
}

interface DealingOptions {
    time: number,
}