
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
