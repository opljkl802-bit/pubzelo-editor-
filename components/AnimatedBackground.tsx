import React from 'react';

const AnimatedBackground: React.FC = () => {
  const words = Array.from({ length: 15 });

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-900 -z-10 overflow-hidden">
      {words.map((_, i) => {
        const style = {
          // Start at a random vertical position, and off-screen to the left
          top: `${Math.random() * 100}%`,
          left: '-25%', // Start well off-screen
          fontSize: `${Math.random() * 120 + 20}px`,
          // Long duration for a slow flow
          animationDuration: `${Math.random() * 60 + 50}s`, // 50s to 110s
          // Staggered start times
          animationDelay: `-${Math.random() * 160}s`,
        };
        return (
          <span
            key={i}
            className="absolute text-slate-700/30 font-black animate-water-flow select-none"
            style={style}
          >
            Pubzelo
          </span>
        );
      })}
      <style>{`
        @keyframes water-flow {
          0% {
            transform: translateX(0) translateY(2vh) rotate(-5deg) skew(-8deg);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          25% {
            transform: translateX(35vw) translateY(-2vh) rotate(5deg) skew(5deg);
          }
          50% {
            transform: translateX(70vw) translateY(3vh) rotate(-2deg) skew(-2deg);
            opacity: 0.4;
          }
          75% {
             transform: translateX(105vw) translateY(-3vh) rotate(3deg) skew(8deg);
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateX(140vw) translateY(0vh) rotate(-5deg) skew(-5deg);
            opacity: 0;
          }
        }
        .animate-water-flow {
          animation-name: water-flow;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;
