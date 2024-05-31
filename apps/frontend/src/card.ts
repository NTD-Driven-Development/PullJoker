import { Path, Rectangle, Raster, Point, Size, Color, Group } from 'paper/dist/paper-core';
import { Asset, AssetManager } from '~/core/stage';
import _ from 'lodash';

const BASE_WIDTH = 128;
const BASE_HEIGHT = 178;

export class Card extends Group implements CardData {
    private cardImage: paper.Raster;
    cardType: number = 2;
    cardNo: number = 2;
    backCardNo: number = 4;
    faceDown: boolean = false;

    constructor() {
        super();

        this.applyMatrix = false;

        this.cardImage = new Raster();
        this.cardImage.size = new Size(BASE_WIDTH, BASE_HEIGHT);
        this.cardImage.translate(new Point(this.cardImage.width / 2, this.cardImage.height / 2));

        const border = new Path.Rectangle(new Rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT), [4, 4]);
        this.addChild(this.cardImage);
        this.addChild(border);

        this.init();
        this.onFrame = this.frame;
    }

    private init = () => {
        // load asset
        const playingCardsAssetUrl = useAssetImageUrl('PlayingCards 128x178.png');
        const jokersAssetUrl = useAssetImageUrl('Jokers 128x178.png');
        const cardBacksAssetUrl = useAssetImageUrl('Card Backs 128x178.png');
        AssetManager.addAsset('PlayingCards', Asset.FromURL(playingCardsAssetUrl));
        AssetManager.addAsset('Jokers', Asset.FromURL(jokersAssetUrl));
        AssetManager.addAsset('CardBacks', Asset.FromURL(cardBacksAssetUrl));
    }

    frame = () => {
        const playingCardsAsset = AssetManager.useAsset<ImageBitmap>('PlayingCards')?.data;
        const jokersAsset = AssetManager.useAsset<ImageBitmap>('Jokers')?.data;
        const cardBacksAsset = AssetManager.useAsset<ImageBitmap>('CardBacks')?.data;

        this.strokeColor = new Color(0.6, 0.6, 0.6);

        if (playingCardsAsset && jokersAsset && cardBacksAsset) {
            if (this.faceDown && _.includes([1, 2, 3, 4], this.backCardNo)) {
                this.cardImage.clear();
                this.cardImage.drawImage(cardBacksAsset, new Point((this.backCardNo - 1) * -128, 0));
            }
            else if (_.includes([1, 2, 3, 4], this.cardType)) {
                this.cardImage.clear();
                this.cardImage.drawImage(playingCardsAsset, new Point((this.cardNo - 1) * -128, (this.cardType - 1) * -178));
            }
            else if (_.includes([5], this.cardType)) {
                this.cardImage.clear();
                this.cardImage.drawImage(jokersAsset, new Point((this.cardNo - 1) * -128, 0));
            }
        }
    }
}

export interface CardData {
    cardType: number;
    cardNo: number;
    backCardNo: number;
    faceDown: boolean;
}