
"use client";

import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function BiblePage() {
  const { t } = useTranslation();
  return (
    <div className="w-full h-screen flex flex-col pt-24">
      <div className="container mx-auto px-4 mb-4">
        <div className="relative flex items-center justify-center">
          <Link href="/" passHref className="absolute left-0">
            <Button variant="ghost" size="icon">
              <Home className="h-6 w-6" />
              <span className="sr-only">Home</span>
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-center">{t('bible.title')}</h1>
        </div>
      </div>
      <iframe
        src="https://www.biblica.com/bible/"
        className="w-full h-full border-0"
        title={t('bible.title')}
        allowFullScreen
      ></iframe>
    </div>
  );
}
