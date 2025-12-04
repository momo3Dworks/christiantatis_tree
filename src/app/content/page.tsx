
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function ContentPage() {
  const { t } = useTranslation();

  const youtubeVideos = [
    { id: "SoT5i-32v7M", title: "O que é a Christianitatis?" },
    { id: "wXLFY_g4iX4", title: "Como o Espírito Santo se manifesta?" },
    { id: "S08x5fC0-Yc", title: "O que é o Batismo com o Fogo?" },
    { id: "R_c4b9z_j0A", title: "Oração e Jejum" },
  ];

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="grid gap-16">
        {/* YouTube Section */}
        <section>
          <div className="relative flex items-center justify-center mb-8">
            <h2 className="text-3xl font-bold text-center">{t('content.youtubeTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
            {youtubeVideos.map((video) => (
              <div key={video.id} className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-lg"
                ></iframe>
              </div>
            ))}
          </div>
        </section>

        {/* Spotify Section */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8">{t('content.spotifyTitle')}</h2>
          <iframe
            style={{ borderRadius: "12px" }}
            src="https://open.spotify.com/embed/playlist/0iBAb0s0istA22a9iQpY4a?utm_source=generator"
            width="100%"
            height="352"
            frameBorder="0"
            allowFullScreen={true}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Christianitatis Spotify Playlist"
          ></iframe>
        </section>
      </div>
    </div>
  );
}
