
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, Music, ChevronLeft, ChevronRight } from "lucide-react";


export default function ContentPage() {
  const { t } = useTranslation();
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const [youtubeVideos, setYoutubeVideos] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const response = await fetch('/api/youtube');
        if (response.ok) {
          const data = await response.json();
          if (data.videos) {
            setYoutubeVideos(data.videos);
          }
        }
      } catch (error) {
        console.error("Failed to fetch videos", error);
      }
    }
    fetchVideos();
  }, []);

  const videosToShow = showAllVideos ? youtubeVideos : youtubeVideos.slice(0, 4);

  const openVideoModal = (videoId: string) => {
    setSelectedVideoId(videoId);
  };

  const closeVideoModal = () => {
    setSelectedVideoId(null);
  };

  const handleNextVideo = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedVideoId) return;
    const currentIndex = youtubeVideos.findIndex(v => v.id === selectedVideoId);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % youtubeVideos.length;
    setSelectedVideoId(youtubeVideos[nextIndex].id);
  };

  const handlePrevVideo = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedVideoId) return;
    const currentIndex = youtubeVideos.findIndex(v => v.id === selectedVideoId);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + youtubeVideos.length) % youtubeVideos.length;
    setSelectedVideoId(youtubeVideos[prevIndex].id);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-24">
        <Tabs defaultValue="youtube" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="youtube">
              <Youtube className="mr-2" />
              {t('content.youtubeTitle')}
            </TabsTrigger>
            <TabsTrigger value="spotify">
              <Music className="mr-2" />
              {t('content.spotifyTitle')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="youtube">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
              {videosToShow.map((video) => (
                <div key={video.id} onClick={() => openVideoModal(video.id)} className="group cursor-pointer">
                  <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                      alt={video.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play-circle"><circle cx="12" cy="12" r="10" /><polygon points="10,8 16,12 10,16 10,8" /></svg>
                    </div>
                  </div>
                  <h3 className="mt-2 font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{video.title}</h3>
                </div>
              ))}
            </div>
            {youtubeVideos.length > 4 && (
              <div className="flex justify-center mt-8">
                <Button onClick={() => setShowAllVideos(!showAllVideos)}>
                  {showAllVideos ? t('content.viewLess') : t('content.viewMore')}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="spotify">
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
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedVideoId} onOpenChange={(isOpen) => !isOpen && closeVideoModal()}>
        <DialogContent className="max-w-screen-xl w-full bg-transparent border-0 shadow-none p-0 flex items-center justify-center gap-4 sm:gap-8 focus:outline-none">
          <DialogTitle className="sr-only">Video Player</DialogTitle>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-12 w-12 rounded-full flex-shrink-0"
            onClick={handlePrevVideo}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <div className="relative aspect-video w-full max-w-5xl bg-black rounded-xl overflow-hidden shadow-2xl">
            {selectedVideoId && (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-12 w-12 rounded-full flex-shrink-0"
            onClick={handleNextVideo}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
