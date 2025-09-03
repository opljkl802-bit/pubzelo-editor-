export const addWatermark = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Prepare watermark text
      const text = 'Pubzelo';
      const padding = Math.min(img.width, img.height) * 0.02; // 2% padding
      const fontSize = Math.max(12, Math.min(img.width, img.height) * 0.025); // 2.5% font size, with a minimum of 12px

      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';

      // Draw text with a subtle shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Position and draw the watermark
      ctx.fillText(text, canvas.width - padding, canvas.height - padding);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (error) => {
      console.error('Error loading image for watermarking:', error);
      // Return the original URL if watermarking fails
      resolve(imageUrl);
    };
  });
};
