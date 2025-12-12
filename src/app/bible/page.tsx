"use client";

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from "@/hooks/useTranslation";
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react";

// Configure worker locally
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function BiblePage() {
  const { t } = useTranslation();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.5);
  const [loading, setLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading simulation: The component mounts when the page is visited.
  // We can just rely on the standard React lifecycle for this.
  // The user specifically asked for a loader that activates ONLY when entering this page.
  // Since this is a client component on a Next.js page, it will mount when navigated to.

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      return Math.max(1, Math.min(newPage, numPages || 1));
    });
  };

  const changeScale = (delta: number) => {
    setScale(prevScale => Math.max(0.5, Math.min(prevScale + delta, 3.0)));
  };

  // Responsive scale adjustment on mount
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width < 640) {
          setScale(0.9); // Mobile
        } else if (width < 1024) {
          setScale(1.2); // Tablet
        } else {
          setScale(1.5); // Desktop
        }
      }
    };

    // Initial call
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full flex flex-col pt-24 min-h-screen items-center bg-background/50" ref={containerRef}>
      <div className="container mx-auto px-4 mb-4">
        <div className="relative flex items-center justify-center">
          <h1 className="text-4xl font-bold text-center mb-6">{t('bible.title')}</h1>
        </div>
      </div>

      <div className="w-full max-w-4xl flex flex-col items-center gap-4 px-4 pb-20">

        {/* HUD Controls */}
        <div className="sticky top-20 z-10 bg-card/80 backdrop-blur-md p-2 rounded-xl shadow-lg border border-border flex flex-wrap gap-2 items-center justify-center">
          <Button variant="ghost" size="icon" onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium w-24 text-center">
            Page {pageNumber} of {numPages || '--'}
          </span>

          <Button variant="ghost" size="icon" onClick={() => changePage(1)} disabled={pageNumber >= (numPages || 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-2 hidden sm:block"></div>

          <Button variant="ghost" size="icon" onClick={() => changeScale(-0.1)}>
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium w-12 text-center hidden sm:block">
            {Math.round(scale * 100)}%
          </span>

          <Button variant="ghost" size="icon" onClick={() => changeScale(0.1)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* PDF Viewer */}
        <div className="w-full flex justify-center min-h-[500px] border rounded-lg bg-white overflow-auto shadow-xl relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground animate-pulse">Loading Holy Bible...</p>
            </div>
          )}

          <Document
            file="/assets/sagradaBiblia_portuguese.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center h-96 w-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <span className="text-sm text-muted-foreground">Initializing PDF...</span>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-96 w-full text-destructive">
                Error loading PDF. Please try refreshing.
              </div>
            }
            className="pdf-document"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-md"
            />
          </Document>
        </div>

      </div>
    </div>
  );
}
