import axios from 'axios';
import _ from 'lodash';

export class AssetManager {
    private static instance: AssetManager;
    private mapping: Map<string, Asset>;

    private constructor() {
        this.mapping = new Map();
    }

    private static getInstance(): AssetManager {
        if (!AssetManager.instance) {
            AssetManager.instance = new AssetManager();
        }

        return AssetManager.instance;
    }

    static useAsset = <T>(key: string) => {
        const am = this.getInstance();
        const target = am.mapping.get(key);
        
        if (target)
            return target as Asset<T>;

        return null;
    }

    static useAssetAsync = async <T>(key: string, addWhenNotExist?: AssetGenerator<T>) => {
        const am = this.getInstance();
        const target = am.mapping.get(key);
            
        if (target)
            return target;

        if (addWhenNotExist)
            return await AssetManager.addAsset(key, addWhenNotExist);

        return null;
    }

    static addAsset = async <T>(key: string, generator: AssetGenerator<T>, replaceWhenExist: boolean = false) => {
        const am = this.getInstance();
        const target = am.mapping.get(key);

        if (target) {
            if (!replaceWhenExist)
                return;
        }
        
        const asset = await generator.generate();

        if (!asset)
            return;

        am.mapping.set(key, asset);
        return asset;
    }
}

export class Asset<T = any> {
    data: T;

    constructor(data: T) {
        this.data = data;
    }

    static FromURL = (url: string) => ({
        generate: async () => {
            const image = (await axios.get(url, { responseType: 'blob' })).data;
            const imageBitmap = await createImageBitmap(image);
            const asset = new Asset(imageBitmap);
            return asset;
        }
    }) as AssetGenerator<ImageBitmap>;
}

interface AssetGenerator<T> {
    generate: () => Promise<Asset<T> | null>,
}