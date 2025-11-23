
"use client";

import { Midi } from "@tonejs/midi";
import { Play, Square, Music, Pause, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { cn } from "@/lib/utils";
import { type PlaybackState } from "@/app/page";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AVAILABLE_MIDIS = [
    { name: "Mii Channel Theme", path: "/midis/Mii_Channel.mid" },
    { name: "Star Wars Theme", path: "/midis/StarWars_theme.mid" },
    { name: "Misty - Johnny Mathis", path: "/midis/Johnny_Mathis-Misty.mid" },
    { name: "Bohemian Rhapsody", path: "/midis/bohemian1.mid" },
    { name: "Game of Thrones", path: "/midis/game_of_thrones.mid" },
    { name: "Super Mario - Overworld", path: "/midis/mario_-_overworld_theme.mid" },
];

interface MidiLibraryProps {
    onMidiSelected: (path: string | null) => void;
    playbackState: PlaybackState;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    playbackSpeed: number;
    onSpeedChange: (speed: number) => void;
    isMidiPlayerActive: boolean;
}

export function MidiLibrary({
    onMidiSelected,
    playbackState,
    onPause,
    onResume,
    onStop,
    playbackSpeed,
    onSpeedChange,
    isMidiPlayerActive
}: MidiLibraryProps) {
    const [selectedMidiPath, setSelectedMidiPath] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleSelectMidi = (path: string) => {
        if (playbackState !== 'stopped') {
            onStop();
        }
        setSelectedMidiPath(path);
        onMidiSelected(path);
        setIsSheetOpen(false);
    }

    const handleTogglePlayback = () => {
        if (playbackState === 'playing') {
            onPause();
        } else if (playbackState === 'paused' || playbackState === 'stopped') {
            if (playbackState === 'stopped' && selectedMidiPath) {
                onMidiSelected(selectedMidiPath)
            } else {
                onResume();
            }
        }
    };

    const isPlayingOrPaused = playbackState === 'playing' || playbackState === 'paused';

    return (
        <div className={cn(
            "fixed z-30 flex items-center gap-2 transition-all duration-300 ease-in-out",
            isMidiPlayerActive
                ? "bottom-4 left-1/2 -translate-x-1/2"
                : "bottom-4 left-1/2 -translate-x-1/2"
        )}>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-full bg-black/20 hover:bg-black/40 text-orange-300 hover:text-orange-100 backdrop-blur-md"
                    >
                        <Music className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent
                    side="bottom"
                    className="bg-purple-950/40 border-t border-orange-500/20 text-orange-100 backdrop-blur-md rounded-t-lg"
                >
                    <SheetHeader>
                        <SheetTitle className="text-orange-100">MIDI Library</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                        <div className="flex flex-col gap-2">
                            {AVAILABLE_MIDIS.map((midi) => (
                                <Button
                                    key={midi.path}
                                    variant="ghost"
                                    onClick={() => handleSelectMidi(midi.path)}
                                    className={cn(
                                        "justify-start text-lg h-14",
                                        selectedMidiPath === midi.path && "bg-orange-500/20"
                                    )}
                                >
                                    {midi.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <Button
                variant="ghost"
                size="icon"
                onClick={handleTogglePlayback}
                disabled={playbackState === 'loading' || !selectedMidiPath}
                className="h-12 w-12 rounded-full bg-black/20 hover:bg-black/40 text-orange-300 hover:text-orange-100 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md"
            >
                {playbackState === 'playing' ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>

            {isPlayingOrPaused && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onStop}
                    className="h-12 w-12 rounded-full bg-black/20 hover:bg-black/40 text-orange-300 hover:text-orange-100 backdrop-blur-md"
                >
                    <Square className="h-6 w-6" />
                </Button>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={!selectedMidiPath}
                        className="h-12 w-12 rounded-full bg-black/20 hover:bg-black/40 text-orange-300 hover:text-orange-100 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md"
                    >
                        <ChevronsRight className="h-6 w-6" />
                        <span className="absolute text-xs bottom-1">{playbackSpeed}x</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-purple-950/80 border-orange-500/30 text-orange-100 backdrop-blur-md">
                    <DropdownMenuItem onClick={() => onSpeedChange(0.5)} className="focus:bg-purple-800/70">0.5x</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSpeedChange(1)} className="focus:bg-purple-800/70">1x</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSpeedChange(1.5)} className="focus:bg-purple-800/70">1.5x</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

        </div>
    );
}
