
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

export default function StartBibleMeetingContent() {
  const { t } = useTranslation();

  return (
    <div className="PreviewContent flex flex-col items-center justify-center p-4 md:p-8 text-foreground">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t('contentPreview.startMeeting.title')}</h1>
        </header>

        <main className="space-y-12">
          <section className="grid grid-cols-1 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('contentPreview.startMeeting.whatIsChurchTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('contentPreview.startMeeting.whatIsChurchDesc')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('contentPreview.startMeeting.whatIsHomeChurchTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('contentPreview.startMeeting.whatIsHomeChurchDesc')}
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-center mb-8">{t('contentPreview.startMeeting.relatedVideosTitle')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">{t('contentPreview.startMeeting.videoPlaceholder')} {index + 1}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
