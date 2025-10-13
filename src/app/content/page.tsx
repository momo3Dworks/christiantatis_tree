
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function ContentPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="grid gap-16">
        {/* YouTube Section */}
        <section>
            <div className="relative flex items-center justify-center mb-8">
                <h2 className="text-3xl font-bold text-center">{t('content.youtubeTitle')}</h2>
            </div>
          <div className="text-center p-8 border rounded-lg">
            <p className="text-muted-foreground">{t('content.youtubePlaceholder')}</p>
          </div>
        </section>

        {/* Spotify Section */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8">{t('content.spotifyTitle')}</h2>
          <div className="text-center p-8 border rounded-lg">
            <p className="text-muted-foreground">{t('content.spotifyPlaceholder')}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
