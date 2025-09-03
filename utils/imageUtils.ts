import type { AspectRatio } from '../types';

const getGridDimensions = (numImages: number): { rows: number; cols: number } => {
  if (numImages <= 1) return { rows: 1, cols: 1 };
  if (numImages === 2) return { rows: 1, cols: 2 };
  if (numImages === 3) return { rows: 1, cols: 3 };
  if (numImages === 4) return { rows: 2, cols: 2 };
  if (numImages <= 6) return { rows: 2, cols: 3 };
  if (numImages <= 9) return { rows: 3, cols: 3 };
  return { rows: Math.ceil(Math.sqrt(numImages)), cols: Math.ceil(Math.sqrt(numImages)) };
};

const getCanvasSize = (aspectRatio: AspectRatio, maxDimension: number = 1024): { width: number, height: number } => {
    switch(aspectRatio) {
        case '4:3': return { width: maxDimension, height: maxDimension * 0.75 };
        case '16:9': return { width: maxDimension, height: maxDimension * (9/16) };
        case '9:16': return { width: maxDimension * (9/16), height: maxDimension };
        case '1:1': 
        default:
            return { width: maxDimension, height: maxDimension };
    }
};

export const createImageGrid = async (imageSrcs: string[], aspectRatio: AspectRatio): Promise<string> => {
  const canvas = document.createElement('canvas');
  const { width, height } = getCanvasSize(aspectRatio);
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.fillStyle = '#1e293b'; // slate-800
  ctx.fillRect(0, 0, width, height);

  const images = await Promise.all(
    imageSrcs.map(src => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    }))
  );

  const { rows, cols } = getGridDimensions(images.length);
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  images.forEach((img, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    const cellAspectRatio = cellWidth / cellHeight;
    const imgAspectRatio = img.width / img.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgAspectRatio > cellAspectRatio) {
      // Image is wider than cell, fit to width
      drawWidth = cellWidth;
      drawHeight = drawWidth / imgAspectRatio;
      offsetX = col * cellWidth;
      offsetY = row * cellHeight + (cellHeight - drawHeight) / 2;
    } else {
      // Image is taller than cell, fit to height
      drawHeight = cellHeight;
      drawWidth = drawHeight * imgAspectRatio;
      offsetX = col * cellWidth + (cellWidth - drawWidth) / 2;
      offsetY = row * cellHeight;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  });

  return canvas.toDataURL('image/png');
};
