import { Path, Rectangle, Color, Point, Group } from 'paper/dist/paper-core';
import { Power2 } from 'gsap';
import { Card } from '~/src/card';
import _ from 'lodash';

export class DiscardPile extends Group {
    cards: Card[];

    constructor(position: paper.PointLike) {
        super();
        
        this.applyMatrix = false;
        this.cards = [];

        const border = new Path.Rectangle(new Rectangle(0, 0, 250, 250));
        border.fillColor = new Color(0, 0, 0);
        this.addChild(border);

        this.position = new Point(position);
    }
}