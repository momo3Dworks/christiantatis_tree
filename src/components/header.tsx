"use client";

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Sun, Moon, Home, Globe, Play, Pause, User, Youtube, Instagram, Facebook } from 'lucide-react';
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
import { useUser } from '@/firebase';
import LoginDialog from './auth/LoginDialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useSupabaseClient } from '@supabase/auth-helpers-react';


export default function Header({ setLoginDialogOpen, isLoginDialogOpen, onTitleClick }: { setLoginDialogOpen: (open: boolean) => void, isLoginDialogOpen: boolean, onTitleClick?: () => void }) {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);

  const { t, setLocale, locale } = useTranslation();
  const { toast } = useToast();
  const pathname = usePathname();
  const audioContext = useContext(AudioContext);
  const { user, isUserLoading } = useUser();
  const supabase = useSupabaseClient();

  const navItems = [
    { href: '/', label: t('header.home') },
    { href: '/events', label: t('header.events') },
    { href: '/bible', label: t('header.onlineBible') },
    { href: '/content', label: t('header.content') },
    { href: '/faq', label: t('header.faq') },
    { href: '/forum', label: t('header.forum') },
    { href: '/contact', label: t('header.contactUs') },
  ];

  const pagesWithHomeIcon = ['/events', '/bible', '/content', '/faq', '/forum', '/contact', '/profile'];
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

  const handleTitleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onTitleClick) {
      e.preventDefault(); // Prevent navigation if it's acting as a return button
      onTitleClick();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "See you soon!"
    });
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
            <div className="flex items-center gap-4 mt-6">
              <a href="https://www.youtube.com/@christianitatis2106" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Youtube className="w-5 h-5" />
                <span className="sr-only">YouTube</span>
              </a>
              <a href="https://www.instagram.com/christianitatis" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="w-5 h-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://www.facebook.com/christianitatis" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Facebook className="w-5 h-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="https://www.reddit.com/user/Glass-Composer6628/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm5.74-4.694a.968.968 0 0 0-1.339-1.401 2.661 2.661 0 0 1-3.456 0 .968.968 0 0 0-1.338 1.401 4.59 4.59 0 0 0 6.132 0zM5.742 12a4.017 4.017 0 0 0-3.3-2.164A4.018 4.018 0 0 0 5.742 12zM12 12a4.017 4.017 0 0 0-3.3-2.164A4.018 4.018 0 0 0 12 12zm0-7a3.99 3.99 0 0 1 2.214 7.334 3.99 3.99 0 1 1-2.214-7.334z" /></svg>
                <span className="sr-only">Reddit</span>
              </a>

            </div>
            <div className="absolute bottom-8 left-0 right-0 p-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="theme-toggle">Theme</Label>
                <Button
                  id="theme-toggle"
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                >
                  {theme === 'light' ? <Moon /> : <Sun />}
                  <span className="sr-only">Toggle Theme</span>
                </Button>
              </div>
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
          <Link href="/" onClick={handleTitleClick} className="relative text-sm sm:text-2xl font-bold tracking-wider flex items-center justify-center h-full min-h-[32px] min-w-[240px]">
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
          <Link href="/" onClick={handleTitleClick}>
            <Image src="/assets/Logo_Christianitatis.png" alt="Christianitatis Logo" width={40} height={40} />
          </Link>
        </div>

        {/* Right Side: Theme and Language Toggles */}
        <div className="flex items-center max-[630px]:gap-0 gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url ?? ''} alt={user.user_metadata?.full_name ?? 'User'} />
                    <AvatarFallback>{getInitials(user.user_metadata?.full_name || user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.email || 'Profile'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <LoginDialog open={isLoginDialogOpen} onOpenChange={setLoginDialogOpen}>
              <Button variant="ghost" size="icon" disabled={isUserLoading} onClick={() => setLoginDialogOpen(true)}>
                <User className="h-6 w-6 max-[630px]:h-5 max-[630px]:w-5" />
              </Button>
            </LoginDialog>
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
