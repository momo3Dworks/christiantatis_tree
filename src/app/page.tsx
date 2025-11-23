
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import YouTube from 'react-youtube';
import { AudioProvider, useAudio } from '@/contexts/audio-provider';
import { identifyChord, midiNoteToName } from '@/lib/music-theory';
import Image from 'next/image';
import { QualityLevel } from '@/components/SettingsMenu';
import { useSceneLoader, type LoadedAssets } from '@/hooks/use-scene-loader';
import { MidiState } from '@/components/MidiStatus';
import { ChordInfo } from '@/components/ChordDisplay';
import { gsap } from 'gsap';
import * as THREE from 'three';
import { Midi } from '@tonejs/midi';
import { useLearningMode } from '@/hooks/use-learning-mode';
import { ClientScene } from '@/components/client-scene';
import { type SceneContainerRef } from '@/components/scene-container';
import { SceneUI } from '@/components/scene-ui';
import { InteractionModal } from '@/components/interaction-modal';


const midiNoteToKeyName: { [key: number]: string } = {
  // White keys
  48: 'C3', 50: 'D3', 52: 'E3', 53: 'F3', 55: 'G3', 57: 'A3', 59: 'B3',
  60: 'C4', 62: 'D4', 64: 'E4', 65: 'F4', 67: 'G4', 69: 'A4', 71: 'B4',
  72: 'C5', 74: 'D5', 76: 'E5', 77: 'F5', 79: 'G5', 81: 'A5', 83: 'B5',
  84: 'C6', 86: 'D6', 88: 'E6', 89: 'F6', 91: 'G6', 93: 'A6', 95: 'B6',
  96: 'C7',
  // Black keys
  49: 'C_Sharp3', 51: 'D_Sharp3', 54: 'F_Sharp3', 56: 'G_Sharp3', 58: 'A_Sharp3',
  61: 'C_Sharp4', 63: 'D_Sharp4', 66: 'F_Sharp4', 68: 'G_Sharp4', 70: 'A_Sharp4',
  73: 'C_Sharp5', 75: 'D_Sharp5', 78: 'F_Sharp5', 80: 'G_Sharp5', 82: 'A_Sharp5',
  85: 'C_Sharp6', 87: 'D_Sharp6', 90: 'F_Sharp6', 92: 'G_Sharp6', 94: 'A_Sharp6',
};

export type PlaybackState = 'stopped' | 'playing' | 'paused' | 'loading';

function MainContent() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isYoutubePlaying, setIsYoutubePlaying] = useState(true);
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('Medium');
  const playerRef = useRef<any>(null);
  const sceneRef = useRef<SceneContainerRef>(null);

  const { audioCache, isLoaded: isAudioLoaded, progress: audioProgress } = useAudio();
  const { assets, isLoaded: areAssetsLoaded, progress: assetsProgress } = useSceneLoader({ skip: !isAudioLoaded });

  const isFullyLoaded = isAudioLoaded && areAssetsLoaded;

  const [midiState, setMidiState] = useState<MidiState>({ status: 'pending', lastMessage: null });
  const [currentChord, setCurrentChord] = useState<ChordInfo | null>(null);

  const keyMaterialsRef = useRef<{ [keyName: string]: THREE.MeshStandardMaterial }>({});
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const activeAnimationsRef = useRef<{ [note: number]: THREE.AnimationAction }>({});
  const masterVolume = 1;

  const [currentMidi, setCurrentMidi] = useState<Midi | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackTime, setPlaybackTime] = useState(0);

  const scheduledEventsRef = useRef<number[]>([]);

  // Audio State Refs
  const activeAudioIdsRef = useRef<{ [note: number]: number }>({});
  const heldKeysRef = useRef<Set<number>>(new Set());
  const isSustainPedalDownRef = useRef(false);

  const {
    currentItem: learningMode,
    notesToHighlight,
    progressionState,
    isCorrectChord,
    selectItem,
    handleNoteOn: learningHandleNoteOn,
    handleNoteOff: learningHandleNoteOff,
    restartProgression,
    activeNotes
  } = useLearningMode();

  useEffect(() => {
    if (isCorrectChord) {
      setCurrentChord({ name: "Good job!", notes: [] });
      const timer = setTimeout(() => {
        setCurrentChord(identifyChord(activeNotes));
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCurrentChord(identifyChord(activeNotes));
    }
  }, [isCorrectChord, activeNotes]);

  useEffect(() => {
    if (isCorrectChord && sceneRef.current) {
      sceneRef.current.triggerParticlesForNotes(notesToHighlight);
    }
  }, [isCorrectChord, notesToHighlight]);


  let loadingStep = '';
  let loadingProgress = 0;
  if (!isAudioLoaded) {
    loadingStep = 'Loading Audio Assets...';
    loadingProgress = audioProgress;
  } else if (!areAssetsLoaded) {
    loadingStep = 'Loading 3D Assets...';
    loadingProgress = assetsProgress;
  }

  const handleInteraction = () => {
    setHasInteracted(true);
    if (playerRef.current) {
      playerRef.current.playVideo();
      setIsYoutubePlaying(true);
    }
  };

  const updateKeyVisuals = useCallback((note: number, isPressed: boolean, velocity: number = 100) => {
    const keyName = midiNoteToKeyName[note];
    if (!keyName || !assets.animations) return;

    // --- Material/Emissive Update ---
    const material = keyMaterialsRef.current[keyName] as THREE.MeshStandardMaterial;
    if (material) {
      gsap.killTweensOf(material);
      if (isPressed) {
        const isBlackKey = keyName.includes('_Sharp');
        const intensity = 2 + (velocity / 127) * 6;
        material.emissive.set(isBlackKey ? '#FFA500' : '#0504AA');
        gsap.to(material, { emissiveIntensity: intensity, duration: 0.1 });
      } else {
        // Highlighting for learning mode is handled in a separate useEffect
        if (!notesToHighlight.includes(note)) {
          gsap.to(material, { emissiveIntensity: 0, duration: 0.3 });
        }
      }
    }

    // --- Animation Update ---
    // Only animate physical key presses if not in MIDI playback mode
    if (playbackState !== 'playing') {
      const animationName = `${keyName}Action`;
      const clip = THREE.AnimationClip.findByName(assets.animations, animationName);
      if (clip && mixerRef.current) {
        let action = activeAnimationsRef.current[note];
        if (!action) {
          action = mixerRef.current.clipAction(clip);
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
          activeAnimationsRef.current[note] = action;
        }

        action.paused = false;
        if (isPressed) {
          action.timeScale = 1.5;
          action.reset().play();
        } else {
          if (action.isRunning()) {
            action.timeScale = -1.5;
          } else { // If not running, play it backwards from the end
            action.reset().play();
            action.time = action.getClip().duration;
            action.timeScale = -1.5;
          }
        }
      }
    }
  }, [assets.animations, notesToHighlight, playbackState]);

  // Convert MIDI note number to file name (C2 = 36, C4 = 60, C9 = 120)
  const midiToNoteName = useCallback((midiNote: number): string | null => {
    const noteNames = ['C', 'C_Sharp', 'D', 'D_Sharp', 'E', 'F', 'F_Sharp', 'G', 'G_Sharp', 'A', 'A_Sharp', 'B'];

    // C2 = MIDI 36, C9 = MIDI 120
    // Transpose notes outside this range
    let transposedMidi = midiNote;

    // If note is below C2 (36), transpose up by octaves until in range
    while (transposedMidi < 36) {
      transposedMidi += 12;
    }

    // If note is above C9 (120), transpose down by octaves until in range
    while (transposedMidi > 120) {
      transposedMidi -= 12;
    }

    // Calculate note name from transposed MIDI number
    const noteIndex = (transposedMidi - 36) % 12; // 0-11
    const octave = Math.floor((transposedMidi - 36) / 12) + 2; // 2-9

    return `${noteNames[noteIndex]}${octave}`;
  }, []);

  const playNoteAudio = useCallback((midiNote: number, velocity: number) => {
    if (!isAudioLoaded || !audioCache) return;

    const noteName = midiToNoteName(midiNote);
    if (!noteName) return;

    const soundPath = `/sounds/piano/${noteName}.mp3`;
    const sound = audioCache[soundPath];

    if (sound) {
      // Velocity Curve: Exponential for more natural dynamic range
      const volume = Math.pow(velocity / 127, 2) * masterVolume;
      const id = sound.play();
      sound.volume(volume, id);
      activeAudioIdsRef.current[midiNote] = id;
    } else {
      console.warn(`Audio not found: ${soundPath}`);
    }
  }, [audioCache, isAudioLoaded, masterVolume, midiToNoteName]);

  const stopNoteAudio = useCallback((midiNote: number) => {
    if (!isAudioLoaded || !audioCache) return;

    // If sustain pedal is down, do not stop the audio yet
    if (isSustainPedalDownRef.current) return;

    const id = activeAudioIdsRef.current[midiNote];
    if (id !== undefined) {
      const noteName = midiToNoteName(midiNote);
      if (noteName) {
        const soundPath = `/sounds/piano/${noteName}.mp3`;
        const sound = audioCache[soundPath];
        if (sound) {
          // Fade out over 300ms for a natural release
          sound.fade(sound.volume(id) as number, 0, 300, id);
        }
      }
      delete activeAudioIdsRef.current[midiNote];
    }
  }, [audioCache, isAudioLoaded, midiToNoteName]);

  const handleSustainPedal = useCallback((value: number) => {
    const isDown = value >= 64;
    isSustainPedalDownRef.current = isDown;

    if (!isDown) {
      // Pedal released: stop all notes that are not physically held
      Object.keys(activeAudioIdsRef.current).forEach(noteStr => {
        const note = parseInt(noteStr);
        if (!heldKeysRef.current.has(note)) {
          stopNoteAudio(note);
        }
      });
    }
  }, [stopNoteAudio]);

  const handleNoteOn = useCallback((note: number, velocity = 100) => {
    heldKeysRef.current.add(note);
    learningHandleNoteOn(note);
    playNoteAudio(note, velocity);
    updateKeyVisuals(note, true, velocity);
  }, [learningHandleNoteOn, playNoteAudio, updateKeyVisuals]);

  const handleNoteOff = useCallback((note: number) => {
    heldKeysRef.current.delete(note);
    learningHandleNoteOff(note);
    stopNoteAudio(note);
    updateKeyVisuals(note, false);
  }, [learningHandleNoteOff, stopNoteAudio, updateKeyVisuals]);

  const handleMidiMessage = useCallback((message: WebMidi.MIDIMessageEvent) => {
    const [command, data1, data2] = message.data;
    const commandType = command & 0xF0;
    const channel = command & 0x0F;

    let messageData = { command: commandType, channel, data1, data2, timestamp: Date.now() };
    setMidiState(prevState => ({ ...prevState, lastMessage: messageData }));

    switch (commandType) {
      case 0x90: // Note On
        if (data2 > 0) {
          handleNoteOn(data1, data2);
        } else { // Note Off message sent as Note On with velocity 0
          handleNoteOff(data1);
        }
        break;
      case 0x80: // Note Off
        handleNoteOff(data1);
        break;
      case 0xB0: // Control Change
        if (data1 === 64) {
          handleSustainPedal(data2);
        }
        break;
    }
  }, [handleNoteOn, handleNoteOff, handleSustainPedal]);

  // --- MIDI Playback Logic ---

  const stopPlayback = useCallback(() => {
    if (currentMidi) {
      // Turn off any lingering highlighted keys from MIDI playback
      Object.values(keyMaterialsRef.current).forEach(material => {
        if (material.emissive.getHex() === 0x87CEEB) { // Sky blue for MIDI playback
          gsap.to(material, { emissiveIntensity: 0, duration: 0.3 });
        }
      });
    }
    scheduledEventsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    scheduledEventsRef.current = [];
    setPlaybackState('stopped');
    setPlaybackTime(0);
    setCurrentMidi(null);
  }, [currentMidi]);


  const startPlayback = useCallback((midi: Midi, resumeTime = 0) => {
    if (!midi) return;

    const allNotes = midi.tracks.flatMap(track => track.notes);
    allNotes.sort((a, b) => a.time - b.time);

    const timeoutIds: number[] = [];

    allNotes.forEach(note => {
      // note.time is in Song Seconds.
      // resumeTime is in Song Seconds.
      // playbackSpeed scales Song Seconds to Wall Seconds.

      if (note.time >= resumeTime) {
        const timeUntilNoteOn = (note.time - resumeTime) / playbackSpeed;
        const onId = setTimeout(() => {
          playNoteAudio(note.midi, note.velocity * 127);
          // Visual feedback for MIDI playback (highlight, no animation)
          const keyName = midiNoteToKeyName[note.midi];
          const material = keyMaterialsRef.current[keyName];
          if (material) {
            gsap.killTweensOf(material);
            material.emissive.set('#87CEEB'); // Sky Blue for MIDI notes
            gsap.to(material, { emissiveIntensity: 1.5, duration: 0.1 });
          }
        }, timeUntilNoteOn * 1000);
        timeoutIds.push(onId as unknown as number);
      }

      const noteOffTime = note.time + note.duration;
      if (noteOffTime >= resumeTime) {
        const timeUntilNoteOff = (noteOffTime - resumeTime) / playbackSpeed;
        const offId = setTimeout(() => {
          // Turn off visual feedback
          const keyName = midiNoteToKeyName[note.midi];
          const material = keyMaterialsRef.current[keyName];
          if (material) {
            gsap.killTweensOf(material);
            gsap.to(material, { emissiveIntensity: 0, duration: 0.3 });
          }
        }, timeUntilNoteOff * 1000);
        timeoutIds.push(offId as unknown as number);
      }
    });

    scheduledEventsRef.current = timeoutIds;

    const songEndTime = midi.duration;
    if (songEndTime > resumeTime) {
      const timeUntilEnd = (songEndTime - resumeTime) / playbackSpeed;
      const endId = setTimeout(() => {
        stopPlayback();
      }, timeUntilEnd * 1000 + 1000); // Add a small buffer
      scheduledEventsRef.current.push(endId as unknown as number);
    } else {
      stopPlayback();
    }

    setPlaybackState('playing');

  }, [playNoteAudio, stopPlayback, playbackSpeed]);

  // Effect to handle speed changes dynamically
  useEffect(() => {
    if (playbackState === 'playing' && currentMidi) {
      // Clear existing timeouts
      scheduledEventsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      scheduledEventsRef.current = [];

      // Restart scheduling from current time with new speed
      // We use the functional update or a ref to get the latest time without adding it to dependencies
      // But here we can just use the current value of playbackTime state, 
      // provided we DO NOT add playbackTime to the dependency array.
      // React hooks linter might complain, but this is intentional to avoid 60fps re-scheduling.
      startPlayback(currentMidi, playbackTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackSpeed]);

  useEffect(() => {
    let animationFrameId: number;
    let playbackStartTime: number | null = null;
    let pausedTime = 0;

    const animate = () => {
      if (playbackState === 'playing' && playbackStartTime !== null) {
        const elapsedTime = (performance.now() - playbackStartTime) / 1000;
        setPlaybackTime(pausedTime + elapsedTime * playbackSpeed);
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    if (playbackState === 'playing') {
      playbackStartTime = performance.now();
      pausedTime = playbackTime; // Store current time when play starts
      animationFrameId = requestAnimationFrame(animate);
    } else {
      playbackStartTime = null; // Reset on pause/stop
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [playbackState, playbackSpeed]);


  const pausePlayback = useCallback(() => {
    if (playbackState !== 'playing') return;

    scheduledEventsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    scheduledEventsRef.current = [];

    setPlaybackState('paused');

  }, [playbackState]);

  const resumePlayback = useCallback(() => {
    if (playbackState !== 'paused' || !currentMidi) return;
    startPlayback(currentMidi, playbackTime);
  }, [playbackState, currentMidi, startPlayback, playbackTime]);

  const onMidiSelected = useCallback(async (path: string | null) => {
    if (playbackState !== 'stopped') {
      stopPlayback();
    }
    if (!path) {
      setCurrentMidi(null);
      return;
    }

    setPlaybackState('loading');
    try {
      const midi = await Midi.fromUrl(path);
      setCurrentMidi(midi);
      startPlayback(midi);
    } catch (error) {
      console.error("Failed to load MIDI", error);
      setPlaybackState('stopped');
    }
  }, [stopPlayback, startPlayback, playbackState]);

  useEffect(() => {
    let midiAccess: WebMidi.MIDIAccess | null = null;

    const onMIDISuccess = (ma: WebMidi.MIDIAccess) => {
      midiAccess = ma;
      setMidiState({ status: 'connected', lastMessage: null });

      if (midiAccess.inputs.size === 0) {
        setMidiState({ status: 'disconnected', lastMessage: null });
      } else {
        midiAccess.inputs.forEach(input => {
          input.onmidimessage = handleMidiMessage;
        });
      }

      const onStateChange = (event: WebMidi.MIDIConnectionEvent) => {
        if (event.port.type === 'input') {
          const input = event.port as WebMidi.MIDIInput;
          if (event.port.state === 'connected') {
            input.onmidimessage = handleMidiMessage;
            if ((midiAccess?.inputs.size || 0) > 0) {
              setMidiState({ status: 'connected', lastMessage: null });
            }
          } else if (event.port.state === 'disconnected') {
            input.onmidimessage = null;
            if ((midiAccess?.inputs.size || 0) === 0) {
              setMidiState({ status: 'disconnected', lastMessage: null });
            }
          }
        }
      };

      midiAccess.addEventListener('statechange', onStateChange);

      return () => {
        if (midiAccess) {
          midiAccess.removeEventListener('statechange', onStateChange);
          midiAccess.inputs.forEach(input => {
            input.onmidimessage = null;
          });
        }
      }
    };

    const onMIDIFailure = (msg: string) => {
      setMidiState({ status: 'error', lastMessage: null, errorMessage: msg });
    };

    if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess as any, () => onMIDIFailure('Permission denied or MIDI not supported.'));
    } else {
      setMidiState({ status: 'unavailable', lastMessage: null, errorMessage: 'Web MIDI API is not supported in this browser.' });
    }
  }, [handleMidiMessage]);


  useEffect(() => {
    // This effect handles the visual state for learning mode highlights.
    Object.entries(midiNoteToKeyName).forEach(([noteStr, keyName]) => {
      const note = parseInt(noteStr, 10);
      const material = keyMaterialsRef.current[keyName] as THREE.MeshStandardMaterial;

      if (material) {
        // Don't change visuals for actively played notes or midi-played notes
        if (activeNotes.includes(note) || (playbackState === 'playing' && material.emissive.getHex() === 0x87CEEB)) return;

        gsap.killTweensOf(material);
        if (notesToHighlight.includes(note)) {
          // Apply learning highlight
          material.emissive.set('#87CEEB');
          gsap.to(material, { emissiveIntensity: 1.5, duration: 0.3 });
        } else {
          // Turn off emissive
          gsap.to(material, { emissiveIntensity: 0, duration: 0.3 });
        }
      }
    });
  }, [notesToHighlight, activeNotes, playbackState]);

  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(2.3);
    if (hasInteracted) {
      playerRef.current.playVideo();
      setIsYoutubePlaying(true);
    }
  };

  const toggleYoutubeAudio = useCallback(() => {
    if (!playerRef.current) return;

    if (isYoutubePlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsYoutubePlaying(prev => !prev);
  }, [isYoutubePlaying]);

  const onSceneInit = useCallback((initArgs: {
    keyMaterials: typeof keyMaterialsRef.current;
    mixer: typeof mixerRef.current;
  }) => {
    keyMaterialsRef.current = initArgs.keyMaterials;
    mixerRef.current = initArgs.mixer;
  }, []);

  const onKeyClick = useCallback((note: number) => {
    handleNoteOn(note);
    setTimeout(() => {
      handleNoteOff(note);
    }, 150);
  }, [handleNoteOn, handleNoteOff]);


  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background">
      {!hasInteracted ? (
        <InteractionModal
          onInteract={handleInteraction}
          isLoading={!isFullyLoaded}
          loadingStep={loadingStep}
          progress={loadingProgress}
        />
      ) : (
        <>
          <ClientScene
            ref={sceneRef}
            assets={assets as LoadedAssets}
            qualityLevel={qualityLevel}
            onSceneInit={onSceneInit}
            onKeyClick={onKeyClick}
            midi={currentMidi}
            playbackState={playbackState}
            playbackSpeed={playbackSpeed}
          />
          <SceneUI
            learningMode={learningMode}
            progressionState={progressionState}
            onProgressionRestart={restartProgression}
            currentChord={currentChord}
            currentMidi={currentMidi}
            onMidiSelected={onMidiSelected}
            playbackState={playbackState}
            onPause={pausePlayback}
            onResume={resumePlayback}
            onStop={stopPlayback}
            playbackTime={playbackTime}
            playbackSpeed={playbackSpeed}
            onSpeedChange={setPlaybackSpeed}
            qualityLevel={qualityLevel}
            onQualityChange={setQualityLevel}
            onSelectItem={selectItem}
            midiState={midiState}
            isYoutubePlaying={isYoutubePlaying}
            toggleYoutubeAudio={toggleYoutubeAudio}
          />
        </>
      )}
      <div className="absolute -z-10 opacity-0">
        <YouTube
          videoId="dqtdKvyS80c"
          opts={{
            height: '0',
            width: '0',
            playerVars: {
              autoplay: 0,
              loop: 1,
              playlist: 'dqtdKvyS80c',
              origin: typeof window !== 'undefined' ? window.location.origin : undefined,
              enablejsapi: 1,
              host: 'https://www.youtube.com',
            },
          }}
          onReady={onPlayerReady}
        />
      </div>
      <Image
        src="/assets/Pianissta_Logo_tiny.webp"
        alt="Pianissta Logo"
        width={83}
        height={17}
        priority
        className="absolute bottom-4 right-4 z-0 opacity-40 pointer-events-none invert"
        style={{ width: 'auto', height: 'auto' }}
      />
    </main>
  );
}


export default function Home() {
  return (
    <AudioProvider>
      <MainContent />
    </AudioProvider>
  )
}


