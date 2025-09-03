export interface EditedImageResult {
  imageUrl: string;
  text: string;
}

export type Mode = 'editor' | 'generator' | 'enhance' | 'expand' | 'video';
export type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16';

export type User = {
  isGuest: boolean;
  email?: string;
  name?: string;
  picture?: string;
};

export type Project = {
  id: string;
  originalImageUrl: string | null;
  resultImageUrl: string;
  prompt: string;
  mode: Mode;
  timestamp: number;
  aspectRatio?: AspectRatio;
};