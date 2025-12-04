
"use client";

import { useState, Suspense, useContext, useEffect, useCallback, useRef } from 'react';
import MemoizedScene from '@/components/scene';
import Loader from '@/components/Loader';
import { AudioContext } from '@/context/AudioContext';
import { useTranslation } from '@/hooks/useTranslation';
import SoundwaveButton from '@/components/SoundwaveButton';
import Header from '@/components/header';

function App() {
  const [assets, setAssets] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [startIntro, setStartIntro] = useState(false);
  const audioContext = useContext(AudioContext);
  const { t } = useTranslation();
  const [viewState, setViewState] = useState<'default' | 'zoomed'>('default');
  const [introAnimationComplete, setIntroAnimationComplete] = useState(false);
  const [isLoginDialogOpen, setLoginDialogOpen] = useState(false);

  // A ref to hold the scene's handleReturn function
  const returnHandlerRef = useRef<(() => void) | null>(null);

  const handleIntroAnimationComplete = useCallback(() => {
    setIntroAnimationComplete(true);
  }, []);

  useEffect(() => {
    if (assets && audioContext) {
      const audioElement = assets.audio;
      audioContext.setAudioElement(audioElement);
    }
  }, [assets, audioContext]);

  const handleLoaded = (loadedAssets: any) => {
    setAssets(loadedAssets);
    setLoading(false);
    setHasInteracted(true);
    setStartIntro(true);
  };

  const handleTitleClick = () => {
    if (returnHandlerRef.current) {
      returnHandlerRef.current();
    }
  }
  
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {loading && <Loader onLoaded={handleLoaded} />}
      
      {!loading && hasInteracted && <Header setLoginDialogOpen={setLoginDialogOpen} isLoginDialogOpen={isLoginDialogOpen} onTitleClick={handleTitleClick} />}

      {assets && !isLoginDialogOpen && <MemoizedScene assets={assets} hasInteracted={hasInteracted} startIntroAnimation={startIntro} onIntroAnimationComplete={handleIntroAnimationComplete} setViewState={setViewState} viewState={viewState} isLoginDialogOpen={isLoginDialogOpen} setReturnHandler={(handler) => returnHandlerRef.current = handler} />}
      {hasInteracted && <SoundwaveButton />}
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
