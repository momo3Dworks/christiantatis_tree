
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { TranslationProvider } from '@/context/TranslationContext';
import { Suspense, useState, useEffect } from 'react';
import { SAOProvider } from '@/context/SAOContext';
import { AudioProvider } from '@/context/AudioContext';
import Header from '@/components/header';
import { usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import CookieConsent from '@/components/cookie-consent';
import { GeolocationProvider } from '@/context/GeolocationContext';
import { FirebaseProvider } from '@/firebase';


// This metadata is static and will not be translated
// export const metadata: Metadata = {
//   title: 'Christianitatis',
//   description: 'Christianitatis',
// };

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [isLoginDialogOpen, setLoginDialogOpen] = useState(false);

  // On the homepage, the Header is rendered inside the App component, not here.
  const showHeader = !isHomePage;

  return (
    <>
      {showHeader && <Header setLoginDialogOpen={setLoginDialogOpen} isLoginDialogOpen={isLoginDialogOpen} />}
      {children}
    </>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [supabaseClient] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Forum&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SessionContextProvider supabaseClient={supabaseClient}>
          <SAOProvider>
            <AudioProvider>
              <TranslationProvider>
                <GeolocationProvider>
                  <FirebaseProvider>
                    <Suspense fallback={<div>Loading...</div>}>
                      <RootLayoutContent>{children}</RootLayoutContent>
                    </Suspense>
                  </FirebaseProvider>
                  <Toaster />
                  <CookieConsent />
                </GeolocationProvider>
              </TranslationProvider>
            </AudioProvider>
          </SAOProvider>
        </SessionContextProvider>
      </body>
    </html>
  );
}
