

import React from 'react';

const Loader: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-400"></div>
        <p className="text-fuchsia-300 text-lg font-medium text-center">{message || 'AI is thinking...'}</p>
    </div>
  );
};

export default Loader;