
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

export default function AboutUsContent() {
  const { t } = useTranslation();
  const values = [
    { title: t('contentPreview.aboutUs.faith'), description: t('contentPreview.aboutUs.faithDesc') },
    { title: t('contentPreview.aboutUs.community'), description: t('contentPreview.aboutUs.communityDesc') },
    { title: t('contentPreview.aboutUs.service'), description: t('contentPreview.aboutUs.serviceDesc') },
    { title: t('contentPreview.aboutUs.integrity'), description: t('contentPreview.aboutUs.integrityDesc') },
    { title: t('contentPreview.aboutUs.worship'), description: t('contentPreview.aboutUs.worshipDesc') },
    { title: t('contentPreview.aboutUs.discipleship'), description: t('contentPreview.aboutUs.discipleshipDesc') },
  ];

  return (
    <div className="PreviewContent p-4 md:p-8 text-foreground">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t('contentPreview.aboutUs.title')}</h1>
        </header>

        <main className="space-y-12">
          <section className="grid md:grid-cols-1 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('contentPreview.aboutUs.missionTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-lg">
                  {t('contentPreview.aboutUs.missionDescription')}
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-center mb-8">{t('contentPreview.aboutUs.valuesTitle')}</h2>
            <div className="grid grid-cols-1 gap-6">
              {values.map((value, index) => (
                <Card key={index}>
                    <CardHeader>
                        <CardTitle>{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{value.description}</p>
                    </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
