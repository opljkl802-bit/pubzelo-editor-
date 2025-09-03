import React, { useRef, useEffect, useState } from 'react';

interface MaskableImageProps {
  src: string;
  tool: 'brush' | 'eraser';
  brushSize: number;
  onMaskChange: (mask: string | null) => void;
  resetKey: number;
}

const MaskableImage: React.FC<MaskableImageProps> = ({ src, tool, brushSize, onMaskChange, resetKey }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const drawOnCanvas = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x,y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (isDrawing) {
      drawOnCanvas(e);
    }
  };

  const handleMouseUp = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.closePath();
    setIsDrawing(false);
    
    // Create the final black and white mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');

    if(maskCtx){
        // Black background
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        // Draw the mask from the drawing canvas in white
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.drawImage(canvas, 0, 0);

        // Check if there is anything drawn
        const imgData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        let hasDrawing = false;
        for (let i = 0; i < imgData.data.length; i += 4) {
            // Check alpha channel
            if (imgData.data[i+3] > 0) {
                hasDrawing = true;
                break;
            }
        }
        
        if (hasDrawing) {
            onMaskChange(maskCanvas.toDataURL('image/png'));
        } else {
            onMaskChange(null);
        }
    }
  };
  
  const resetCanvas = () => {
      const canvas = canvasRef.current;
      const image = imageRef.current;
      if (!canvas || !image) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onMaskChange(null);
  }

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    
    const handleLoad = () => {
        resetCanvas();
    };

    image.addEventListener('load', handleLoad);
    if(image.complete) {
        handleLoad();
    }

    return () => image.removeEventListener('load', handleLoad);
  }, [src]);

  useEffect(() => {
    resetCanvas();
  }, [resetKey]);


  return (
    <div ref={containerRef} className="relative w-full aspect-auto rounded-lg overflow-hidden border-2 border-slate-600">
      <img ref={imageRef} src={src} alt="To be edited" className="w-full h-full object-contain" />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default MaskableImage;
