import { basename } from 'pathe';

export const useAssetImageUrls = () => {
    return getAssetImages();
}

export const useAssetImageUrl = (fileName: string) => {
    const images = getAssetImages();
    return images[fileName];
}

const getAssetImages = () => {
    const glob = import.meta.glob('~/assets/images/*', { eager: true });
	const images = Object.fromEntries(Object.entries(glob).map(([key, value]) => [basename(key), (value as any).default]));
    return images;
}