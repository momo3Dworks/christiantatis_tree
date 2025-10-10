
"use client";

import { useState, Suspense, useContext, useEffect } from 'react';
import MemoizedScene from '@/components/scene';
import Loader from '@/components/Loader';
import { AudioContext } from '@/context/AudioContext';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import SoundwaveButton from '@/components/SoundwaveButton';

function App() {
  const [assets, setAssets] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [startIntro, setStartIntro] = useState(false);
  const audioContext = useContext(AudioContext);
  const { t } = useTranslation();

  useEffect(() => {
    if (assets && audioContext) {
      audioContext.setAudioElement(assets.audio);
    }
  }, [assets, audioContext]);

  const handleLoaded = (loadedAssets: any) => {
    setAssets(loadedAssets);
    setLoading(false);
  };
  
  const handleEnterClick = () => {
    if (audioContext && !audioContext.isPlaying) {
      audioContext.play();
    }
    setShowOverlay(false); // Starts fade out
    setTimeout(() => {
      setHasInteracted(true); // Fully removes overlay and starts animations after fade
      setStartIntro(true); // Start intro animation
    }, 500); // Match duration of transition
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {loading && <Loader onLoaded={handleLoaded} />}
      
      {!loading && !hasInteracted && (
        <div
          className={`absolute inset-0 bg-white/60 backdrop-blur-md z-50 flex flex-col transition-opacity duration-500 ${showOverlay ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="flex-grow flex items-center justify-center">
            <h1 className="text-4xl font-bold text-foreground">{t('welcome.title')}</h1>
          </div>
          <div className="flex justify-center pb-20">
            <Button 
              size="lg" 
              onClick={handleEnterClick}
              className="enter-button-gradient text-foreground hover:bg-foreground hover:text-background transition-colors duration-300 border border-white/50 shadow-lg"
            >
              ENTER
            </Button>
          </div>
        </div>
      )}

      {assets && <MemoizedScene assets={assets} hasInteracted={hasInteracted} startIntroAnimation={startIntro} />}
      <SoundwaveButton />
    </main>
  );
}


export default function Home() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>}>
        <App />
    </Suspense>
  );
}
