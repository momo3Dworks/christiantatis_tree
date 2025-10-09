
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sun, Moon, Home, Globe } from 'lucide-react';
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
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

export default function Header() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  const { t, setLocale, locale } = useTranslation();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/events', label: t('header.events') },
    { href: '/bible', label: t('header.onlineBible') },
    { href: '/content', label: t('header.content') },
    { href: '/faq', label: t('header.faq') },
    { href: '/forum', label: t('header.forum') },
    { href: '/contact', label: t('header.contactUs') },
  ];

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
              <SheetTitle><span className="sr-only">Navigation</span></SheetTitle>
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
          </SheetContent>
        </Sheet>
        
        {/* Center: Title */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-fit"
          onMouseEnter={() => setIsTitleHovered(true)}
          onMouseLeave={() => setIsTitleHovered(false)}
        >
          <Link href="/" className="text-sm max-[500px]:text-lg sm:text-2xl font-bold tracking-wider flex items-center justify-center w-auto h-full">
            {isTitleHovered ? <Home className="h-8 w-8" /> : "CHRISTIANITATIS"}
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
