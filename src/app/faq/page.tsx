
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function FaqPage() {
  const { t } = useTranslation();

  const faqItems = [
    {
      question: t('faq.q1'),
      answer: t('faq.a1'),
    },
    {
      question: t('faq.q2'),
      answer: t('faq.a2'),
    },
    {
      question: t('faq.q3'),
      answer: t('faq.a3'),
    },
    {
      question: t('faq.q4'),
      answer: t('faq.a4'),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-24 max-w-3xl">
       <div className="relative flex items-center justify-center mb-12">
            <Link href="/" passHref className="absolute left-0">
                <Button variant="ghost" size="icon">
                    <Home className="h-6 w-6" />
                    <span className="sr-only">Home</span>
                </Button>
            </Link>
            <h1 className="text-4xl font-bold text-center">{t('faq.title')}</h1>
        </div>
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
