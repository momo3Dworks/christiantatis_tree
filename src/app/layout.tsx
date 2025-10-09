
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import { TranslationProvider } from '@/context/TranslationContext';
import { Suspense } from 'react';

// This metadata is static and will not be translated
// export const metadata: Metadata = {
//   title: 'Christianitatis',
//   description: 'A minimalist Three.js 3D scene.',
// };

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
        <TranslationProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <Header />
          </Suspense>
          {children}
          <Toaster />
        </TranslationProvider>
      </body>
    </html>
  );
}
