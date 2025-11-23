"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { memo, forwardRef } from 'react';
import { type LoadedAssets } from '@/hooks/use-scene-loader';
import { type QualityLevel } from './SettingsMenu';
import * as THREE from 'three';
import { type Midi } from '@tonejs/midi';
import { type PlaybackState } from '@/app/page';
import { type SceneContainerRef } from './scene-container';

const SceneContainer = dynamic(() => import('./scene-container').then(mod => mod.SceneContainer), {
    ssr: false,
});

interface ClientSceneProps {
    assets: LoadedAssets;
    qualityLevel: QualityLevel;
    onSceneInit: (args: {
        keyMaterials: Record<string, THREE.MeshStandardMaterial>;
        mixer: THREE.AnimationMixer | null;
    }) => void;
    onKeyClick: (note: number) => void;
    midi: Midi | null;
    playbackState: PlaybackState;
    playbackSpeed: number;
}

export const ClientScene = memo(forwardRef<SceneContainerRef, ClientSceneProps>(function ClientScene(props, ref) {
    return <SceneContainer {...props} ref={ref} />;
}), (prevProps, nextProps) => {
    return prevProps.assets === nextProps.assets &&
        prevProps.qualityLevel === nextProps.qualityLevel &&
        prevProps.midi === nextProps.midi &&
        prevProps.playbackState === nextProps.playbackState &&
        prevProps.playbackSpeed === nextProps.playbackSpeed;
});

ClientScene.displayName = 'ClientScene';
