"use client";

import { useState, useEffect } from 'react';
import { Howl } from 'howler';

// Generate note names from C2 to C9 (85 notes total)
const generateNoteNames = (): string[] => {
  const noteNames: string[] = [];
  const notes = ['C', 'C_Sharp', 'D', 'D_Sharp', 'E', 'F', 'F_Sharp', 'G', 'G_Sharp', 'A', 'A_Sharp', 'B'];

  // C2 to B8 (full chromatic scale)
  for (let octave = 2; octave <= 8; octave++) {
    for (const note of notes) {
      noteNames.push(`${note}${octave}`);
    }
  }

  // C9 (highest note)
  noteNames.push('C9');

  return noteNames;
};

const noteNames = generateNoteNames();
console.log(`Loading ${noteNames.length} piano samples from C2 to C9...`);

export const useAudioLoader = () => {
  const [audioCache, setAudioCache] = useState<{ [key: string]: Howl }>({});
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let loadedCount = 0;
    const totalCount = noteNames.length;
    const cache: { [key: string]: Howl } = {};

    const loadAudio = (noteName: string) => {
      return new Promise<void>((resolve, reject) => {
        const soundPath = `/sounds/piano/${noteName}.mp3`;

        const sound = new Howl({
          src: [soundPath],
          onload: () => {
            loadedCount++;
            setProgress((loadedCount / totalCount) * 100);
            resolve();
          },
          onloaderror: (id, err) => {
            console.error(`Failed to load audio: ${soundPath}`, err);
            // Resolve anyway to continue loading
            loadedCount++;
            setProgress((loadedCount / totalCount) * 100);
            resolve();
          }
        });

        cache[soundPath] = sound;
      });
    };

    const loadAll = async () => {
      const promises = noteNames.map(noteName => loadAudio(noteName));
      await Promise.all(promises);
      setAudioCache(cache);
      setIsLoaded(true);
    }

    loadAll();

    return () => {
      // Cleanup Howl instances on unmount
      Object.values(cache).forEach(sound => sound.unload());
    };

  }, []);

  return { audioCache, progress, isLoaded };
};
