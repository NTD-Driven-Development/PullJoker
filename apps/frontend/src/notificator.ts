import { Color, Group, Path, Point, PointText, Rectangle } from "paper/dist/paper-core";
import _ from 'lodash';

export const toast = (text: string, point: paper.PointLike, options?: { time?: number }): ToastCloseHandle => {
    const opt = _.defaults(options, {});

    const group = new Group();

    const pointText = new PointText({
        content: text,
        fillColor: 'red',
        fontSize: '20',
        justification: 'center',
    });

    const border = new Path.Rectangle(new Rectangle([0, 0], pointText.bounds.size.add(25)));
    border.fillColor = new Color(1, 1, 1);
    border.strokeColor = new Color(0.7, 0.7, 0.7);

    group.addChild(border);
    group.addChild(pointText);

    pointText.position = border.bounds.center;

    group.position = new Point(point);
    
    group.onFrame = () => {
        group.bringToFront();
    }

    if (opt.time) {
        setTimeout(() => {
            group?.remove();
        }, opt.time);
    }

    const close = () => {
        group?.remove();
    }

    return close;
}

export type ToastCloseHandle = () => void;