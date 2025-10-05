
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

export default function EventsPage() {
  const [date, setDate] = useState<Date | undefined>();
  const { t } = useTranslation();

  const events = [
    {
      title: t('events.communityBBQ'),
      date: "August 24, 2024",
      description: t('events.communityBBQDesc'),
      image: "https://picsum.photos/seed/event1/400/200",
      imageHint: "community event",
      location: "Church Park",
    },
    {
      title: t('events.youthNight'),
      date: "September 5, 2024",
      description: t('events.youthNightDesc'),
      image: "https://picsum.photos/seed/event2/400/200",
      imageHint: "youth group",
      location: "Online",
    },
    {
      title: t('events.sundayService'),
      date: "September 15, 2024",
      description: t('events.sundayServiceDesc'),
      image: "https://picsum.photos/seed/event3/400/200",
      imageHint: "church service",
      location: "Main Sanctuary",
    },
    {
      title: t('events.fallFestival'),
      date: "October 12, 2024",
      description: t('events.fallFestivalDesc'),
      image: "https://picsum.photos/seed/event4/400/200",
      imageHint: "fall festival",
      location: "Community Grounds",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-24">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-center mb-4">{t('events.title')}</h1>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder={t('events.searchPlaceholder')} className="pl-10 h-12 text-lg" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('events.filters')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="font-semibold">{t('events.format')}</Label>
                <RadioGroup defaultValue="all">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="r1" />
                    <Label htmlFor="r1">{t('events.all')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in-person" id="r2" />
                    <Label htmlFor="r2">{t('events.inPerson')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="online" id="r3" />
                    <Label htmlFor="r3">{t('events.online')}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="font-semibold">{t('events.price')}</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox id="free-events" />
                  <Label htmlFor="free-events">{t('events.freeOnly')}</Label>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="font-semibold">{t('events.date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>{t('events.pickDate')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-4">
                <Label className="font-semibold">{t('events.location')}</Label>
                <div className="space-y-2">
                  <Input placeholder={t('events.country')} />
                  <Input placeholder={t('events.state')} />
                  <Input placeholder={t('events.city')} />
                </div>
              </div>
              <Button className="w-full">{t('events.applyFilters')}</Button>
            </CardContent>
          </Card>
        </aside>

        {/* Events Grid */}
        <main className="md:col-span-3">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, index) => (
              <Card key={index} className="flex flex-col">
                <div className="aspect-video bg-muted flex items-center justify-center">
                    <img src={event.image} alt={event.title} className="object-cover w-full h-full rounded-t-lg" data-ai-hint={event.imageHint} />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <CardDescription>{event.date}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground mb-4">{event.description}</p>
                   <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {event.location}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
