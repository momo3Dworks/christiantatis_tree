
"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";

export default function ForumPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold mb-4">{t('forum.title')}</h1>
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
