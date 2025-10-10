
"use client";

import { useState, Suspense } from 'react';
import MemoizedScene from '@/components/scene';
import Loader from '@/components/Loader';

function App() {
  const [assets, setAssets] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLoaded = (loadedAssets: any) => {
    setAssets(loadedAssets);
    setLoading(false);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {loading && <Loader onLoaded={handleLoaded} />}
      {assets && <MemoizedScene assets={assets} />}
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
