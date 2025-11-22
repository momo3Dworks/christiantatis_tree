
"use client";

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Sun, Moon, Home, Globe, Play, Pause } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { AudioContext } from '@/context/AudioContext';
import { Label } from '@/components/ui/label';

export default function Header() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);

  const { t, setLocale, locale } = useTranslation();
  const { toast } = useToast();
  const pathname = usePathname();
  const audioContext = useContext(AudioContext);


  const navItems = [
    { href: '/', label: t('header.home') },
    { href: '/events', label: t('header.events') },
    { href: '/bible', label: t('header.onlineBible') },
    { href: '/content', label: t('header.content') },
    { href: '/faq', label: t('header.faq') },
    { href: '/forum', label: t('header.forum') },
    { href: '/contact', label: t('header.contactUs') },
  ];

  const pagesWithHomeIcon = ['/events', '/bible', '/content', '/faq', '/forum', '/contact'];
  const showHomeIconInsteadOfText = pagesWithHomeIcon.includes(pathname);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(defaultTheme);
    if (defaultTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  const getLanguageName = (locale: string | null) => {
    switch (locale) {
      case 'en': return 'English';
      case 'es': return 'Español';
      case 'pt': return 'Português';
      case 'fr': return 'Français';
      default: return '';
    }
  }

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale);
    toast({
      title: `${t('header.languageSelected')} ${getLanguageName(newLocale)}`,
    });
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[1350px]">
      <div
        className="relative flex items-center justify-between h-[60px] px-6 rounded-lg shadow-md animated-gradient backdrop-blur-[5px]"
        style={{
          '--gradient-light': 'linear-gradient(90deg, rgba(237, 237, 237, 0.17) 0%, rgba(196, 196, 196, 0.13) 48%, rgba(255, 255, 255, 0.28) 100%)',
          '--gradient-dark': 'linear-gradient(90deg,rgba(255, 0, 0, 0.17) 0%, rgba(20, 165, 255, 0.13) 48%, rgba(109, 242, 0, 0.28) 100%)',
          backgroundImage: theme === 'light' ? 'var(--gradient-light)' : 'var(--gradient-dark)'
        } as React.CSSProperties}
      >
        {/* Left Side: Burger Menu */}
        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle className="font-black text-2xl text-left">CHRISTIANITATIS</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className="text-lg font-medium p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-8 left-0 right-0 p-4 space-y-4">
              {audioContext && audioContext.audioElement && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="audio-toggle">Music</Label>
                  <Button
                    id="audio-toggle"
                    variant="ghost"
                    size="icon"
                    onClick={audioContext.togglePlayPause}
                  >
                    {audioContext.isPlaying ? <Pause /> : <Play />}
                    <span className="sr-only">Toggle Music</span>
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Center: Title for Desktop */}
        <div className="group absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-[767px]:hidden">
          <Link href="/" className="relative text-sm sm:text-2xl font-bold tracking-wider flex items-center justify-center h-full min-h-[32px] min-w-[240px]">
            {showHomeIconInsteadOfText ? (
              <Home className="h-8 w-8" />
            ) : (
              <>
                <span className="transition-opacity duration-300 group-hover:opacity-0">
                  CHRISTIANITATIS
                </span>
                <span className="absolute transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <Home className="h-8 w-8" />
                </span>
              </>
            )}
          </Link>
        </div>

        {/* Center: Logo for Mobile */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
            <Link href="/">
                <Image src="/assets/Logo_Christianitatis.png" alt="Christianitatis Logo" width={40} height={40} />
            </Link>
        </div>

        {/* Right Side: Theme and Language Toggles */}
        <div className="flex items-center max-[630px]:gap-0 gap-2">
          {theme && (
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-6 w-6 max-[630px]:h-5 max-[630px]:w-5" /> : <Sun className="h-6 w-6 max-[630px]:h-5 max-[630px]:w-5" />}
              <span className="sr-only">Toggle theme</span>
              </Button>
          )}
          {locale && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative">
                    <Button variant="ghost" size="icon">
                        <Globe className="h-6 w-6 max-[630px]:h-5 max-[630px]:w-5" />
                        <span className="sr-only">Change language</span>
                    </Button>
                    <span className="absolute top-1 right-0.5 w-4 h-4 text-[10px] flex items-center justify-center bg-muted text-muted-foreground rounded-full font-bold">
                        {locale.toUpperCase()}
                    </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('header.currentLanguage')} {getLanguageName(locale)}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="hover:bg-accent" onSelect={() => handleLanguageChange('en')}>English</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-accent" onSelect={() => handleLanguageChange('es')}>Español</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-accent" onSelect={() => handleLanguageChange('pt')}>Português</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-accent" onSelect={() => handleLanguageChange('fr')}>Français</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

      </div>
    </header>
  );
}
