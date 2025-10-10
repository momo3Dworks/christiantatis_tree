
"use client";

import { useContext, useState, useEffect } from "react";
import { AudioContext } from "@/context/AudioContext";
import { cn } from "@/lib/utils";

export default function SoundwaveButton() {
  const audioContext = useContext(AudioContext);
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(defaultTheme);
  }, []);

  if (!audioContext || !audioContext.audioElement) {
    return null;
  }

  const { isPlaying, togglePlayPause } = audioContext;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[1350px] flex justify-end pointer-events-none">
      <button
        onClick={togglePlayPause}
        className={cn(
          "h-10 w-10 flex items-center justify-center rounded-full shadow-lg animated-gradient backdrop-blur-[5px] cursor-pointer pointer-events-auto",
        )}
        style={{
          '--gradient-light': 'linear-gradient(90deg, rgba(237, 237, 237, 0.17) 0%, rgba(196, 196, 196, 0.13) 48%, rgba(255, 255, 255, 0.28) 100%)',
          '--gradient-dark': 'linear-gradient(90deg,rgba(255, 0, 0, 0.17) 0%, rgba(20, 165, 255, 0.13) 48%, rgba(109, 242, 0, 0.28) 100%)',
          backgroundImage: theme === 'light' ? 'var(--gradient-light)' : 'var(--gradient-dark)'
        } as React.CSSProperties}
        aria-label={isPlaying ? "Pause music" : "Play music"}
      >
        <div className="boxContainer">
          <div className={cn("box box1", { 'paused': !isPlaying })}></div>
          <div className={cn("box box2", { 'paused': !isPlaying })}></div>
          <div className={cn("box box3", { 'paused': !isPlaying })}></div>
          <div className={cn("box box4", { 'paused': !isPlaying })}></div>
          <div className={cn("box box5", { 'paused': !isPlaying })}></div>
        </div>
      </button>
    </div>
  );
}
