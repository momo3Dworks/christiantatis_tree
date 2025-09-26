
'use client';

import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import Header from '@/components/header';
import { ThemeProvider } from '@/components/theme-provider';
import React, { useState, useEffect } from 'react';

const metadata: Metadata = {
  title: 'CHRISTIANITATIS',
  description: 'CHRISTIANITATIS',
  icons: {
    icon: [],
  },
};

const HeaderPlaceholder = () => (
  <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-50">
      <div className="h-[60px] rounded-[2rem] bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm shadow-lg flex items-center justify-between px-6">
      </div>
  </header>
);


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>CHRISTIANITATIS</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Forum&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased text-black">
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
          {isMounted ? <Header /> : <HeaderPlaceholder />}
          <main>{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
