
"use client";

import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';

type AudioContextType = {
  isPlaying: boolean;
  audioElement: HTMLAudioElement | null;
  setAudioElement: (element: HTMLAudioElement) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
};

export const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(() => {
    if (audioElement && audioElement.paused) {
      audioElement.play().then(() => {
        setIsPlaying(true);
      }).catch(error => console.error("Audio play failed:", error));
    }
  }, [audioElement]);

  const pause = useCallback(() => {
    if (audioElement && !audioElement.paused) {
      audioElement.pause();
      setIsPlaying(false);
    }
  }, [audioElement]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);
  
  const handleSetAudioElement = useCallback((element: HTMLAudioElement) => {
    setAudioElement(element);
  }, []);

  const value = useMemo(() => ({
    isPlaying,
    audioElement,
    setAudioElement: handleSetAudioElement,
    play,
    pause,
    togglePlayPause
  }), [isPlaying, audioElement, handleSetAudioElement, play, pause, togglePlayPause]);

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
