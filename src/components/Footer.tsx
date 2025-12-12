
"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import TermsContent from "./legal/TermsContent";
import PrivacyContent from "./legal/PrivacyContent";
import CookiesContent from "./legal/CookiesContent";
import { Youtube, Instagram, Twitter, Facebook } from "lucide-react";

type FooterProps = {
  viewState: 'default' | 'zoomed';
  show: boolean;
};

const Footer = ({ viewState, show }: FooterProps) => {
  const { t } = useTranslation();

  const menuItems = [
    { label: t('footer.terms'), content: <TermsContent /> },
    { label: t('footer.privacy'), content: <PrivacyContent /> },
    { label: t('footer.cookies'), content: <CookiesContent /> },
  ];

  return (
    <footer
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[1350px] text-muted-foreground text-xs transition-all duration-1000",
        show ? "translate-y-0 opacity-60 hover:opacity-100" : "translate-y-24 opacity-0",
        viewState === 'zoomed'
          ? 'opacity-0 pointer-events-none'
          : ''
      )}
    >
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span>{t('footer.copyright')}</span>
          <nav className="flex items-center space-x-2">
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="group relative text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none p-0 cursor-pointer">
                      {item.label}
                      <span className="absolute bottom-0 left-0 h-[1px] w-full bg-current transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[80vw] h-[80vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">{item.label}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-grow pr-6">
                      {item.content}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                {index < menuItems.length - 1 && <span>|</span>}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-4 mr-20">
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
      </div>
    </footer>
  );
};

// Dummy translation keys for the new component
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import pt from '@/locales/pt.json';
import fr from '@/locales/fr.json';

// Adding keys to prevent breaking useTranslation hook if they are not present
(en as any).footer = {
  copyright: "Christianitatis© 2025. All rights reserved",
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  cookies: "Cookies",
};
(es as any).footer = {
  copyright: "Christianitatis© 2025. Todos los derechos reservados",
  terms: "Condiciones de Servicio",
  privacy: "Políticas de Privacidad",
  cookies: "Cookies",
};
(pt as any).footer = {
  copyright: "Christianitatis© 2025. Todos os direitos reservados",
  terms: "Condições de Serviço",
  privacy: "Políticas de Privacidade",
  cookies: "Cookies",
};
(fr as any).footer = {
  copyright: "Christianitatis© 2025. Tous droits réservés",
  terms: "Conditions de Service",
  privacy: "Politiques de Confidentialité",
  cookies: "Cookies",
};


export default Footer;
