import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
      <svg className="w-full h-auto max-w-lg" viewBox="0 0 400 100">
        {/* Define the liquid effect filter */}
        <defs>
          <filter id="liquid-effect">
            <feTurbulence baseFrequency="0.02 0.01" numOctaves="1" result="turbulence" seed="5" />
            <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="15" xChannelSelector="R" yChannelSelector="G" />
            <animate
                attributeName="baseFrequency"
                dur="10s"
                values="0.02 0.01;0.03 0.02;0.02 0.01"
                repeatCount="indefinite"
            />
          </filter>
           <linearGradient id="text-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f472b6" /> {/* fuchsia-400 */}
                <stop offset="100%" stopColor="#22d3ee" /> {/* cyan-400 */}
           </linearGradient>
        </defs>

        {/* Apply the filter and animate the text */}
        <text
          x="50%"
          y="50%"
          dy=".3em"
          textAnchor="middle"
          fontSize="70"
          fontWeight="bold"
          fill="url(#text-gradient)"
          filter="url(#liquid-effect)"
          className="animate-reveal"
        >
          Pubzelo
        </text>
      </svg>
      <style>{`
        @keyframes reveal {
          0% {
            opacity: 0;
            transform: scale(0.8);
            filter: url(#liquid-effect) blur(10px);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: url(#liquid-effect) blur(0px);
          }
        }
        .animate-reveal {
          animation: reveal 2.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;