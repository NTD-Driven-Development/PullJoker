import { Group } from "paper/dist/paper-core";

export class Unit {
    protected _group = new Group();

    getGroup() {
        return this._group;
    }
}