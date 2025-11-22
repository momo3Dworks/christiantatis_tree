
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { MapPin } from "lucide-react";

export default function FindHomeChurchContent() {
  const { t } = useTranslation();

  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [closest, setClosest] = useState("");
  
  const [mapUrl, setMapUrl] = useState("https://maps.google.com/maps?q=churches&output=embed");

  const handleApplyFilters = () => {
    const queryParts = ["churches"];
    if (closest) queryParts.push(closest);
    if (neighborhood) queryParts.push(neighborhood);
    if (city) queryParts.push(city);
    if (state) queryParts.push(state);
    if (country) queryParts.push(country);
    
    const queryString = queryParts.join(", ");
    setMapUrl(`https://maps.google.com/maps?q=${encodeURIComponent(queryString)}&output=embed`);
  };


  return (
    <div className="PreviewContent flex flex-col items-center justify-center p-4 md:p-8 text-foreground h-full">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t('contentPreview.findChurch.title')}</h1>
        </header>

        <main className="grid grid-cols-1 gap-8 h-full">
          {/* Map Section */}
          <div>
            <Card className="h-full min-h-[300px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/> {t('contentPreview.findChurch.mapTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <iframe
                  src={mapUrl}
                  className="w-full h-full border-0 rounded-lg min-h-[450px]"
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps Find Churches"
                ></iframe>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('contentPreview.findChurch.filtersTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="country">{t('contentPreview.findChurch.country')}</Label>
                  <Select onValueChange={setCountry} value={country}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder={t('contentPreview.findChurch.countryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="br">Brazil</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">{t('contentPreview.findChurch.state')}</Label>
                  <Input id="state" placeholder={t('contentPreview.findChurch.statePlaceholder')} value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t('contentPreview.findChurch.city')}</Label>
                  <Input id="city" placeholder={t('contentPreview.findChurch.cityPlaceholder')} value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">{t('contentPreview.findChurch.neighborhood')}</Label>
                  <Input id="neighborhood" placeholder={t('contentPreview.findChurch.neighborhoodPlaceholder')} value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closest">{t('contentPreview.findChurch.closest')}</Label>
                   <Input id="closest" placeholder={t('contentPreview.findChurch.closestPlaceholder')} value={closest} onChange={(e) => setClosest(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleApplyFilters}>{t('contentPreview.findChurch.applyFilters')}</Button>
              </CardContent>
            </Card>
          </div>
        </main>
        
        {/* Results Section */}
        <section className="mt-12">
            <h2 className="text-3xl font-bold mb-6">{t('contentPreview.findChurch.results')}</h2>
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">{t('contentPreview.findChurch.resultsPlaceholder')}</p>
                </CardContent>
            </Card>
        </section>
      </div>
    </div>
  );
}
