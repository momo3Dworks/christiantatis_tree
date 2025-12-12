"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { createBrowserClient } from '@supabase/ssr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";

// Use exact image from the previous first card
const CHURCH_IMAGE = "https://picsum.photos/seed/event1/400/200";

interface HomeChurch {
  id: string;
  name: string;
  meetingDate: string;
  meetingTime: string;
  meetingSchedule: string; // Added field
  neighborhood: string;
  creatorName: string;
  status: string;
  tags: string | null;
  description?: string;
}

export default function EventsPage() {
  const [date, setDate] = useState<Date | undefined>();
  const [churches, setChurches] = useState<HomeChurch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedChurch, setSelectedChurch] = useState<HomeChurch | null>(null);
  const { t } = useTranslation();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchChurches() {
      setLoading(true);
      try {
        let query = supabase.from('home_churches').select('*');
        const { data, error } = await query;

        if (error) throw error;

        // Map snake_case from DB to camelCase for frontend
        const mappedData: HomeChurch[] = (data || []).map((church: any) => ({
          id: church.id,
          name: church.name,
          meetingDate: church.meeting_date, // Keeping for filter if available
          meetingTime: church.meeting_time,
          meetingSchedule: church.meetingSchedule || church.meeting_schedule || "",
          neighborhood: church.neighborhood,
          creatorName: church.creatorName || church.creator_name || "Unknown Host", // prioritizing camelCase column per new schema
          status: church.status || "open",
          tags: church.tags,
          description: church.description
        }));

        setChurches(mappedData);
      } catch (err) {
        console.error("Error fetching churches:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchChurches();
  }, [supabase]);

  // Filtering Logic
  const filteredChurches = churches.filter(church => {
    // 1. Search Filter (Tags) - "El searchbar de arriba debería poder buscar las palabras 'tags'"
    // Also including name for better UX, but emphasizing Tags as requested.
    const searchLower = searchQuery.toLowerCase();
    const tagsMatch = (church.tags ? String(church.tags) : "").toLowerCase().includes(searchLower);
    const nameMatch = (church.name ? String(church.name) : "").toLowerCase().includes(searchLower);
    const searchMatch = !searchQuery || tagsMatch || nameMatch;

    // 2. Status Filter
    const statusMatch = statusFilter === "all" || church.status === statusFilter;

    // 3. Date Filter
    let dateMatch = true;
    if (date) {
      // Simple string comparison for now, assuming YYYY-MM-DD matches
      // Ideally parse church.meetingDate to Date object
      const churchDateStr = church.meetingDate; // e.g. "2024-12-25"
      const filterDateStr = format(date, "yyyy-MM-dd");
      dateMatch = churchDateStr === filterDateStr;
    }

    return searchMatch && statusMatch && dateMatch;
  });

  return (
    <div className="container mx-auto px-4 py-24">
      <header className="mb-12">
        <div className="relative flex items-center justify-center mb-4">
          <h1 className="text-4xl font-bold text-center">{t('events.title')}</h1>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('events.searchPlaceholder') + " (Tags)"}
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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

              {/* Status Filter */}
              <div className="space-y-4">
                <Label className="font-semibold">{t('contentPreview.registerChurch.status')}</Label>
                <RadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="status-all" />
                    <Label htmlFor="status-all">{t('events.all')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="open" id="status-open" />
                    <Label htmlFor="status-open">{t('contentPreview.registerChurch.statusOptions.open')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="status-full" />
                    <Label htmlFor="status-full">{t('contentPreview.registerChurch.statusOptions.full')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="closed" id="status-closed" />
                    <Label htmlFor="status-closed">{t('contentPreview.registerChurch.statusOptions.closed')}</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Date Filter */}
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
                {date && (
                  <Button variant="ghost" size="sm" onClick={() => setDate(undefined)} className="w-full text-xs text-muted-foreground">
                    Clear Date
                  </Button>
                )}
              </div>

              <Button className="w-full" onClick={() => {
                // Basically reset filters
                setStatusFilter("all");
                setDate(undefined);
                setSearchQuery("");
              }}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Events Grid (Church Cards) */}
        <main className="md:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredChurches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No home churches found matching your criteria.
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredChurches.map((church) => (
                <Card key={church.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedChurch(church)}>
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <img
                      src={CHURCH_IMAGE}
                      alt={church.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl line-clamp-1">{church.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3" />
                      {church.meetingSchedule || (church.meetingDate ? `${church.meetingDate} at ${church.meetingTime}` : 'Schedule TBD')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                    <div className="mb-4">
                      <p className="text-sm text-foreground mb-1 font-medium">Host: {church.creatorName}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {/* Description logic: show tags if no description, or generic text */}
                        {church.tags ? `Tags: ${church.tags}` : "Join us for fellowship and worship."}
                      </p>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground mt-auto">
                      <MapPin className="h-4 w-4 mr-1 text-primary" />
                      <span className="truncate">{church.neighborhood || "Location available upon registration"}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      <Dialog open={!!selectedChurch} onOpenChange={(open) => !open && setSelectedChurch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedChurch?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p><strong>Host:</strong> {selectedChurch?.creatorName}</p>
            <p><strong>Schedule:</strong> {selectedChurch?.meetingSchedule || "N/A"}</p>
            <p className="text-sm text-muted-foreground">{selectedChurch?.description || "No description provided."}</p>
          </div>
          <DialogFooter>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/?target=register">Reservar Vaga</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
