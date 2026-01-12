
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { Youtube } from "lucide-react";

export default function StartBibleMeetingContent() {
  const { t } = useTranslation();

  // Helper function to render text with newlines as paragraphs
  const renderWithParagraphs = (text: string) => {
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index} className="text-muted-foreground mb-4 last:mb-0">
        {paragraph}
      </p>
    ));
  };

  const howToStartSteps = [
    t('contentPreview.startMeeting.howToStartStep1'),
    t('contentPreview.startMeeting.howToStartStep2'),
    t('contentPreview.startMeeting.howToStartStep3'),
    t('contentPreview.startMeeting.howToStartStep4'),
    t('contentPreview.startMeeting.howToStartStep5'),
    t('contentPreview.startMeeting.howToStartStep6'),
    t('contentPreview.startMeeting.howToStartStep7'),
  ];

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
                <div>
                  {renderWithParagraphs(t('contentPreview.startMeeting.whatIsHomeChurchDesc'))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('contentPreview.startMeeting.howToStartTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {t('contentPreview.startMeeting.howToStartIntro')}
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  {howToStartSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="w-6 h-6 text-red-600" />
                  {t('contentPreview.startMeeting.relatedVideosTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full rounded-lg overflow-hidden shadow-inner bg-muted">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/videoseries?list=PL_XG1XmE0N_L0vY8S8u8Z6R3Yx-N8o9W-"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
