import React, { useState, useRef, useCallback, TouchEvent, MouseEvent } from 'react';

interface ImageComparerProps {
  original: string;
  edited: string;
}

const ImageComparer: React.FC<ImageComparerProps> = ({ original, edited }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPos(percent);
  }, []);

  const handleMouseDown = () => {
    isDragging.current = true;
  };
  
  const handleMouseUp = () => {
    isDragging.current = false;
  };
  
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    handleMove(e.clientX);
  };
  
  const handleTouchStart = () => {
    isDragging.current = true;
  };
  
  const handleTouchEnd = () => {
    isDragging.current = false;
  };
  
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-full aspect-auto rounded-lg overflow-hidden select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <img
        src={edited}
        alt="Edited"
        className="w-full h-auto block pointer-events-none object-contain max-h-[500px]"
      />
      <div
        className="absolute top-0 left-0 h-full w-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img
          src={original}
          alt="Original"
          className="w-full h-auto block object-contain max-h-[500px]"
        />
      </div>
      <div
        className="absolute top-0 h-full w-1 bg-fuchsia-400/80 cursor-ew-resize"
        style={{ left: `calc(${sliderPos}% - 2px)` }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 bg-fuchsia-400 rounded-full flex items-center justify-center shadow-lg pointer-events-none"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
          </svg>
        </div>
      </div>
       <div
        className="absolute top-0 bottom-0 cursor-ew-resize"
        style={{ left: 0, width: `${sliderPos}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      ></div>
      <div
        className="absolute top-0 bottom-0 cursor-ew-resize"
        style={{ right: 0, width: `${100 - sliderPos}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      ></div>
    </div>
  );
};

export default ImageComparer;
