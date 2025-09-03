

import React, { useRef } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageSelect: (files: FileList) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onImageSelect(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      className="relative w-full h-96 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-600 hover:border-fuchsia-500 transition-colors duration-300 flex items-center justify-center cursor-pointer overflow-hidden group"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        multiple
      />
      <div className="text-center text-slate-400">
        <UploadIcon className="w-16 h-16 mx-auto" />
        <p className="mt-2 text-lg font-semibold">Click to upload image(s)</p>
        <p className="text-sm">PNG, JPG, or WEBP</p>
      </div>
    </div>
  );
};

export default ImageUploader;