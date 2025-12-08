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
import { SupabaseProvider } from '@/lib/supabase/provider';
import CookieConsent from '@/components/cookie-consent';
import Cookies from 'js-cookie';
import { GeolocationProvider } from '@/context/GeolocationContext';


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
        <SupabaseProvider>
          <SAOProvider>
            <AudioProvider>
              <TranslationProvider>
                <GeolocationProvider>
                  <Suspense fallback={<div>Loading...</div>}>
                    <RootLayoutContent>{children}</RootLayoutContent>
                  </Suspense>
                  <Toaster />
                  <CookieConsent />
                </GeolocationProvider>
              </TranslationProvider>
            </AudioProvider>
          </SAOProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
