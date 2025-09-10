export type Mode = 'image' | 'text' | 'sketch' | 'sticker' | 'flashcard' | 'video';
export type StickerSource = 'text' | 'image';
export type GenerationStyle = 'realistic' | 'abstract' | 'cartoon' | 'branded';

export const imageArtStyles = ['Sci-Fi', 'Chibi', 'Anime', 'Cartoon', 'Fantasy', 'Cyberpunk', 'Steampunk', 'Vintage Comic'] as const;
export type ImageArtStyle = typeof imageArtStyles[number];

export type Flashcard = {
    front: string;
    back: string;
    image: string;
};

export const inspirationPrompts = ['Spiderman', 'Stitch', 'Sonic', 'Pikachu', 'Unicorn', 'Minnie Mouse', 'Christmas', 'Halloween'];
export const styles: GenerationStyle[] = ['realistic', 'abstract', 'cartoon', 'branded'];