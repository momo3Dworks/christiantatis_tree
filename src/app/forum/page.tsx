
"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { Home } from "lucide-react";

export default function ForumPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
      <div className="relative flex items-center justify-center mb-4 w-full max-w-2xl">
        <Link href="/" passHref className="absolute left-0">
          <Button variant="ghost" size="icon">
            <Home className="h-6 w-6" />
            <span className="sr-only">Home</span>
          </Button>
        </Link>
        <h1 className="text-4xl font-bold">{t('forum.title')}</h1>
      </div>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        {t('forum.description')}
      </p>
      <Button asChild size="lg">
        <Link href="https://www.reddit.com" target="_blank" rel="noopener noreferrer">
          {t('forum.button')}
        </Link>
      </Button>
    </div>
  );
}
