
"use client";

import { useCallback, useState } from "react";
import { type LearnableItem, type LearnableChordProgression, type SelectableItem } from "@/lib/music-theory";
import { Midi } from "@tonejs/midi";
import { ChordDisplay, type ChordInfo } from './ChordDisplay';
import { LearningDisplay } from './LearningDisplay';
import { MidiLibrary } from './MidiLibrary';
import { MidiStatus, type MidiState } from "./MidiStatus";
import { LearningToolbar } from "./LearningToolbar";
import { SettingsMenu, type QualityLevel } from "./SettingsMenu";
import { PlaybackState } from "@/app/page";
import { MidiPlayer } from "./MidiPlayer";

interface SceneUIProps {
    learningMode: SelectableItem | null;
    progressionState: {
        currentChordIndex: number;
        completed: boolean;
    };
    onProgressionRestart: () => void;
    currentChord: ChordInfo | null;
    currentMidi: Midi | null;
    onMidiSelected: (path: string | null) => void;
    playbackState: PlaybackState;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    playbackTime: number;
    playbackSpeed: number;
    onSpeedChange: (speed: number) => void;
    qualityLevel: QualityLevel;
    onQualityChange: (level: QualityLevel) => void;
    onSelectItem: (item: SelectableItem | null) => void;
    midiState: MidiState;
    isYoutubePlaying: boolean;
    toggleYoutubeAudio: () => void;
}

export function SceneUI({
    learningMode,
    progressionState,
    onProgressionRestart,
    currentChord,
    currentMidi,
    onMidiSelected,
    playbackState,
    onPause,
    onResume,
    onStop,
    playbackTime,
    playbackSpeed,
    onSpeedChange,
    qualityLevel,
    onQualityChange,
    onSelectItem,
    midiState,
    isYoutubePlaying,
    toggleYoutubeAudio
}: SceneUIProps) {

    const handleCloseMidiPlayer = useCallback(() => {
        onMidiSelected(null);
    }, [onMidiSelected]);

    return (
        <>
            <div
                className="fixed top-4 z-20 flex items-center gap-4 opacity-0 animate-slide-in-down"
                style={{
                    animationDelay: '0.2s',
                    left: '32%',
                    transform: 'translateX(-50%)',
                }}
            >
                <div className="hidden min-[790px]:flex">
                    <MidiStatus state={midiState} isYoutubePlaying={isYoutubePlaying} toggleYoutubeAudio={toggleYoutubeAudio} />
                </div>
                <LearningToolbar
                    onSelectItem={onSelectItem}
                    selectedItem={learningMode}
                />
            </div>


            <div
                className="absolute top-4 right-4 z-20 opacity-0 animate-slide-in-down"
                style={{ animationDelay: '0.4s' }}
            >
                <SettingsMenu
                    qualityLevel={qualityLevel}
                    onQualityChange={onQualityChange}
                />
            </div>

            <MidiLibrary
                onMidiSelected={onMidiSelected}
                playbackState={playbackState}
                onPause={onPause}
                onResume={onResume}
                onStop={onStop}
                playbackSpeed={playbackSpeed}
                onSpeedChange={onSpeedChange}
                isMidiPlayerActive={!!currentMidi}
            />

            <LearningDisplay
                item={learningMode}
                progressionState={progressionState}
                onProgressionRestart={onProgressionRestart}
                onStopLearning={() => onSelectItem(null)}
            />

            <ChordDisplay chordInfo={currentChord} isMidiPlayerActive={!!currentMidi} />

        </>
    );
}


