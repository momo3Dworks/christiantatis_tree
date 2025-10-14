
"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import TermsContent from "./legal/TermsContent";
import PrivacyContent from "./legal/PrivacyContent";
import CookiesContent from "./legal/CookiesContent";

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
