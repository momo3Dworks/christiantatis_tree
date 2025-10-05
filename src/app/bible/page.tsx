
"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function BiblePage() {
  const { t } = useTranslation();
  return (
    <div className="w-full h-screen pt-[60px]">
      <iframe
        src="https://www.biblica.com/bible/"
        className="w-full h-full border-0"
        title={t('bible.title')}
        allowFullScreen
      ></iframe>
    </div>
  );
}
