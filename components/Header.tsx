import React from 'react';
import { SparklesIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-slate-900/50 backdrop-blur-sm py-3 px-4 md:px-8 border-b border-slate-700 sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-fuchsia-400" />
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
            Pubzelo
            </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
