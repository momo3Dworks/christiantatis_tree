
"use client";

import React, { useEffect, useState } from 'react';

type FloatingParticlesProps = {
  tintColor?: string;
};

const FloatingParticles = ({ tintColor }: FloatingParticlesProps) => {
  const [specks, setSpecks] = useState<{ id: number; style: React.CSSProperties }[]>([]);

  useEffect(() => {
    const twinkleLoop = (id: number) => {
      const duration = Math.random() * 8 + 5; // Slower, longer life
      const top = `${Math.floor(Math.random() * 100)}%`;
      const left = `${Math.floor(Math.random() * 100)}%`;
      
      let size, opacity, blur;

      // Introduce a chance for much larger particles
      if (Math.random() > 0.95) { // 5% chance for a huge particle
        size = Math.random() * 40 + 10; // 10px to 50px
        opacity = Math.random() * 0.15 + 0.05; // Lower opacity: 0.05 to 0.2
        blur = Math.random() * 4 + 3; // Higher blur: 3px to 7px
      } else {
        size = Math.random() * 8 + 2; // Standard size: 2px to 10px
        opacity = Math.random() * 0.6 + 0.1; // Standard opacity: 0.1 to 0.7
        blur = Math.random() * 3; // Standard blur: 0px to 3px
      }

      setSpecks(prevSpecks => {
        const newSpecks = prevSpecks.filter(s => s.id !== id);
        newSpecks.push({
          id,
          style: {
            top,
            left,
            width: `${size}px`,
            height: `${size}px`,
            opacity: 0, // Start invisible for animation
            animationDuration: `${duration}s`,
            animationTimingFunction: 'cubic-bezier(0.250, 0.250, 0.750, 0.750)',
            animationName: 'twinkle',
            filter: `${tintColor || 'none'} blur(${blur}px)`,
            // Directly set initial opacity for twinkle animation to use
            '--initial-opacity': opacity,
          } as React.CSSProperties,
        });
        return newSpecks;
      });

      setTimeout(() => twinkleLoop(id), duration * 1000);
    };

    // Generate 100 particles
    for (let i = 1; i <= 100; i++) {
      twinkleLoop(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tintColor]);

  const particleStyle: React.CSSProperties = {
    // The tint is now applied per-speck to combine with blur
  };

  return (
    <div className="absolute inset-0 z-15 overflow-hidden pointer-events-none">
      <div id="particle-layer-1" className="particle-layer" style={particleStyle}></div>
      <div id="particle-layer-2" className="particle-layer" style={particleStyle}></div>
      <div id="particle-layer-3" className="particle-layer" style={particleStyle}></div>
      <div className="speck-container" style={particleStyle}>
        {specks.map(speck => (
          <div key={speck.id} className="speck" style={speck.style}></div>
        ))}
      </div>
    </div>
  );
};

export default FloatingParticles;
