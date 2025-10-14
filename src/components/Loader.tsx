
"use client";

import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

interface LoaderProps {
  onLoaded: (assets: any) => void;
}

const assetsToLoad = [
  { path: '/models/CHRISTIANTATIS_TREE.glb', type: 'gltf', id: 'tree' },
  { path: '/models/GRASS.glb', type: 'gltf', id: 'grass' },
  { path: '/assets/SparkVideo.webm', type: 'video', id: 'sparkVideo' },
  { path: '/assets/BallNormal.webp', type: 'texture', id: 'ballNormal' },
  { path: '/assets/SurfaceImperfection01.webp', type: 'texture', id: 'imperfection' },
  { path: '/assets/SkySphere_Albedo.webp', type: 'texture', id: 'skyAlbedoDesktop' },
  { path: '/assets/SkySphere_2K.webp', type: 'texture', id: 'skyAlbedoMobile' },
  { path: '/assets/TreeOfTrust.mp3', type: 'audio', id: 'audio' },
  { path: '/assets/Logo_Christianitatis.png', type: 'image', id: 'logo' },
];

export default function Loader({ onLoaded }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const loadedAssets = useRef<any>({});

  useEffect(() => {
    const manager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(manager);
    const audioLoader = new THREE.AudioLoader(manager);
    const imageLoader = new THREE.ImageLoader(manager);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    const gltfLoader = new GLTFLoader(manager);
    gltfLoader.setDRACOLoader(dracoLoader);

    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      setProgress((itemsLoaded / itemsTotal) * 100);
    };

    manager.onLoad = () => {
      onLoaded(loadedAssets.current);
    };

    assetsToLoad.forEach(asset => {
      switch (asset.type) {
        case 'gltf':
          gltfLoader.load(asset.path, (gltf) => {
            loadedAssets.current[asset.id] = gltf;
          });
          break;
        case 'texture':
          textureLoader.load(asset.path, (texture) => {
            texture.flipY = false;
            loadedAssets.current[asset.id] = texture;
          });
          break;
        case 'image':
            imageLoader.load(asset.path, (image) => {
                loadedAssets.current[asset.id] = image;
            });
            break;
        case 'video':
            const video = document.createElement('video');
            video.src = asset.path;
            video.muted = true;
            video.loop = false;
            video.playsInline = true;
            video.preload = 'auto';
            
            const onCanPlay = () => {
                video.removeEventListener('canplaythrough', onCanPlay);
            };
    
            video.addEventListener('canplaythrough', onCanPlay);
            video.load();
            loadedAssets.current[asset.id] = video;
          break;
        case 'audio':
          const audio = new Audio(asset.path);
          audio.preload = 'auto';
          loadedAssets.current[asset.id] = audio;
          // Audio doesn't play nice with loading manager progress, so we handle it simply.
          // A more robust solution might need to track canplaythrough events for all media.
          break;
      }
    });

  }, [onLoaded]);

  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-background z-50">
      <div className="w-1/2">
        <div className="h-[1px] w-full bg-muted-foreground/20">
          <div className="h-full bg-foreground transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
