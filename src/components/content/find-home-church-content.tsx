
"use client";

import { useState, useEffect, useContext, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/firebase";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { GeolocationContext } from "@/context/GeolocationContext";
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { mapsConfig } from "@/lib/maps-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { generateEmailHtml } from '@/lib/email-templates';
import React from "react";
import {
  AlertCircle,
  MapPin,
  Search,
  Filter,
  X,
  Hourglass,
  Users,
  User as UserIcon,
  Mail,
  Smartphone,
  CheckCircle,
  XCircle,
  Globe,
  Clock,
  Calendar
} from "lucide-react";

// --- Helper Components & Functions ---

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Open':
      return 'bg-green-500';
    case 'Full':
      return 'bg-yellow-500';
    default:
      return 'bg-red-500';
  }
};

const getChurchDay = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  } catch { return ''; }
};

const parseMeetingHour = (timeStr: string): number => {
  if (!timeStr) return -1;
  const cleanStr = timeStr.trim().toLowerCase();
  const isPM = cleanStr.includes('pm');
  const isAM = cleanStr.includes('am');
  const parts = cleanStr.replace(/[^0-9:]/g, '').split(':');
  let hour = parseInt(parts[0], 10);
  if (isNaN(hour)) return -1;
  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;
  return hour;
};

const getTranslatedStatus = (status: string, t: any) => {
  switch (status) {
    case 'Open': return t('contentPreview.registerChurch.statusOptions.open');
    case 'Full': return t('contentPreview.registerChurch.statusOptions.full');
    case 'Closed': return t('contentPreview.registerChurch.statusOptions.closed');
    case 'Temporarily Closed': return t('contentPreview.registerChurch.statusOptions.tempClosed');
    case 'Suspended': return t('contentPreview.registerChurch.statusOptions.suspended');
    default: return status;
  }
};

const ChurchesListHUD = ({ churches, availableCountries, onChurchSelect, onFilterChange }: { churches: any[], availableCountries: string[], onChurchSelect: (church: any) => void, onFilterChange: (filters: { searchQuery: string, statusFilter: string, countryFilter: string, dayFilter: string, timeFilter: string }) => void }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  const handleFilterChange = (newSearchQuery: string, newStatusFilter: string, newCountryFilter: string, newDayFilter: string, newTimeFilter: string) => {
    setSearchQuery(newSearchQuery);
    setStatusFilter(newStatusFilter);
    setCountryFilter(newCountryFilter);
    setDayFilter(newDayFilter);
    setTimeFilter(newTimeFilter);
    onFilterChange({ searchQuery: newSearchQuery, statusFilter: newStatusFilter, countryFilter: newCountryFilter, dayFilter: newDayFilter, timeFilter: newTimeFilter });
  };


  if (!churches) {
    return null;
  }

  const statusOptions = [
    { value: 'all', label: t('events.all') },
    { value: 'Open', label: t('contentPreview.registerChurch.statusOptions.open') },
    { value: 'Full', label: t('contentPreview.registerChurch.statusOptions.full') },
    { value: 'Closed', label: t('contentPreview.registerChurch.statusOptions.closed') },
    { value: 'Temporarily Closed', label: t('contentPreview.registerChurch.statusOptions.tempClosed') },
    { value: 'Suspended', label: t('contentPreview.registerChurch.statusOptions.suspended') },
  ];

  const dayOptions = [
    { value: 'Sunday', label: t('days.sunday') },
    { value: 'Monday', label: t('days.monday') },
    { value: 'Tuesday', label: t('days.tuesday') },
    { value: 'Wednesday', label: t('days.wednesday') },
    { value: 'Thursday', label: t('days.thursday') },
    { value: 'Friday', label: t('days.friday') },
    { value: 'Saturday', label: t('days.saturday') }
  ];
  const timeOptions = [
    { value: 'morning', label: t('time.morning') },
    { value: 'afternoon', label: t('time.afternoon') },
    { value: 'evening', label: t('time.evening') }
  ];

  return (
    <div className="absolute top-4 left-4 z-10 w-[calc(100%-2rem)] max-w-sm md:w-80 transition-all duration-300">
      <Card className="bg-card/50 backdrop-blur-[5px] max-h-[60vh] flex flex-col shadow-sm border-0 md:border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-semibold md:text-xl">{t('contentPreview.registerChurch.upcomingMeetings')}</CardTitle>
          <div className="flex gap-2 pt-1 items-center flex-wrap">
            <div className="relative flex-grow w-full mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t('events.searchPlaceholder')}
                className="pl-8 h-9 text-sm bg-background/60 w-full"
                value={searchQuery}
                onChange={(e) => handleFilterChange(e.target.value, statusFilter, countryFilter, dayFilter, timeFilter)}
              />
            </div>

            <div className="grid grid-cols-3 gap-1 w-full mb-2">
              <Select value={countryFilter} onValueChange={(value) => handleFilterChange(searchQuery, statusFilter, value, dayFilter, timeFilter)}>
                <SelectTrigger className="px-1 justify-center h-8 bg-background/60 text-[10px]" title={t('contentPreview.registerChurch.country')}>
                  <Globe className="h-3 w-3 mr-1" />
                  <span className="truncate">{countryFilter === 'all' ? t('contentPreview.registerChurch.country') : countryFilter}</span>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="all">{t('contentPreview.registerChurch.anyCountry')}</SelectItem>
                  {availableCountries && availableCountries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dayFilter} onValueChange={(value) => handleFilterChange(searchQuery, statusFilter, countryFilter, value, timeFilter)}>
                <SelectTrigger className="px-1 justify-center h-8 bg-background/60 text-[10px]" title={t('contentPreview.registerChurch.day')}>
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className="truncate">{dayFilter === 'all' ? t('contentPreview.registerChurch.day') : dayOptions.find(d => d.value === dayFilter)?.label.substring(0, 3)}</span>
                </SelectTrigger>
                <SelectContent align="center">
                  <SelectItem value="all">{t('contentPreview.registerChurch.anyDay')}</SelectItem>
                  {dayOptions.map(day => (
                    <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={timeFilter} onValueChange={(value) => handleFilterChange(searchQuery, statusFilter, countryFilter, dayFilter, value)}>
                <SelectTrigger className="px-1 justify-center h-8 bg-background/60 text-[10px]" title={t('contentPreview.registerChurch.time')}>
                  <Clock className="h-3 w-3 mr-1" />
                  <span className="truncate">{timeFilter === 'all' ? t('contentPreview.registerChurch.time') : timeOptions.find(t => t.value === timeFilter)?.label}</span>
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">{t('contentPreview.registerChurch.anyTime')}</SelectItem>
                  {timeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={statusFilter} onValueChange={(value) => handleFilterChange(searchQuery, value, countryFilter, dayFilter, timeFilter)}>
              <SelectTrigger className="w-full justify-between px-3 h-8 bg-background/60 text-xs" title={t('contentPreview.registerChurch.status')}>
                <div className="flex items-center"><Filter className="h-3 w-3 mr-2" /> <span className="opacity-70">{t('contentPreview.registerChurch.status')}:</span></div>
                <span className="truncate font-medium">{statusFilter === 'all' ? t('events.all') : statusOptions.find(s => s.value === statusFilter)?.label}</span>
              </SelectTrigger>
              <SelectContent align="end">
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-hidden hidden md:block">
          <ScrollArea className="h-full p-4 pt-0">
            <div className="space-y-2">
              {churches.map(church => (
                <div
                  key={church.id}
                  onClick={() => onChurchSelect(church)}
                  className="p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate pr-2 text-sm">{church.name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(church.status))} />
                      <span className="text-[10px] text-muted-foreground">{getTranslatedStatus(church.status, t)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{church.meetingSchedule}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

const MapUpdater = ({ selectedChurch }: { selectedChurch: any | null }) => {
  const map = useMap();

  React.useEffect(() => {
    if (selectedChurch && map) {
      map.panTo({ lat: selectedChurch.latitude, lng: selectedChurch.longitude });
      map.setZoom(15);
    }
  }, [selectedChurch, map]);

  return null;
};

const ChurchMap = React.memo(({ churches, geolocation, user, selectedChurchFromHud, onChurchSelect }: { churches: any[] | null, geolocation: any, user: any, selectedChurchFromHud: any | null, onChurchSelect: (church: any | null) => void }) => {
  const { t } = useTranslation();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [confirmationChurchId, setConfirmationChurchId] = useState<string | null>(null);

  const handleReserveSpot = async (churchId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to reserve a spot.",
      });
      return;
    }

    const contactPhone = user.phone;
    const whatsappNumber = user.user_metadata?.whatsapp_number;

    if (!contactPhone && !whatsappNumber) {
      toast({
        variant: "destructive",
        title: "Contact Info Required",
        description: "Please go to your profile and add a Phone number or WhatsApp so the host can contact you.",
        action: <Button variant="outline" size="sm" onClick={() => window.location.href = '/profile'}>Go to Profile</Button>
      });
      return;
    }

    try {
      const { data: church, error: fetchError } = await supabase
        .from('home_churches')
        .select('*')
        .eq('id', churchId)
        .single();

      if (fetchError || !church) {
        throw new Error("Church not found or error fetching data.");
      }

      const reservations = church.reservations || [];

      if (reservations.includes(user.id)) {
        toast({
          title: "Already Reserved",
          description: "You have already reserved a spot in this church.",
        });
        return;
      }

      if (church.personLimit && reservations.length >= church.personLimit) {
        toast({
          variant: "destructive",
          title: "Church is Full",
          description: "Sorry, there are no more spots available.",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('home_churches')
        .update({ reservations: [...reservations, user.id] })
        .eq('id', churchId);

      if (updateError) throw updateError;

      // Send Email to Booker
      try {
        const bookerEmailHtml = generateEmailHtml(
          'Reservation Confirmation',
          `
              <div class="info-box">
                  <p>Your reservation at <strong>${church.name}</strong> is confirmed.</p>
                  <p><strong>Schedule:</strong> ${church.meetingSchedule}</p>
              </div>
              <p>We hope you enjoy your visit!</p>
              <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/profile" class="button">View My Reservations</a>
              `
        );

        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: 'Reservation Confirmation - Christianitatis',
            html: bookerEmailHtml
          })
        });

        const creatorEmailHtml = generateEmailHtml(
          'New Reservation Received',
          `
              <p>You have received a new reservation for your church <strong>${church.name}</strong>.</p>
              <div class="info-box" style="text-align: left;">
                  <p style="margin-bottom: 10px;"><strong>Booker's Details:</strong></p>
                  <ul style="padding-left: 20px; color: #334155;">
                  <li><strong>Name:</strong> ${user.user_metadata?.full_name || 'N/A'}</li>
                  <li><strong>Email:</strong> ${user.email}</li>
                  ${user.phone ? `<li><strong>Phone:</strong> ${user.phone}</li>` : ''}
                  ${user.user_metadata?.whatsapp_number ? `<li><strong>WhatsApp:</strong> ${user.user_metadata.whatsapp_number}</li>` : ''}
                  </ul>
              </div>
              <p>You can view all your reservations in your profile.</p>
              <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/profile" class="button">Manage Reservations</a>
              `
        );

        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: church.creatorEmail || 'creator_lookup',
            creatorId: church.creatorId,
            subject: 'New Reservation - Christianitatis',
            html: creatorEmailHtml
          })
        });
      } catch (e) {
        console.error("Email sending failed", e);
      }

      toast({
        title: "Reservation Successful!",
        description: "Your spot has been reserved.",
      });

    } catch (error: any) {
      console.error("Reservation failed: ", error);
      toast({
        variant: "destructive",
        title: "Reservation Failed",
        description: error.message || "Could not reserve a spot. Please try again.",
      });
    } finally {
      setConfirmationChurchId(null);
      onChurchSelect(null);
    }
  };


  if (!geolocation?.location) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Obtaining location...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden min-h-[500px]">
      {mapsConfig.apiKey && mapsConfig.mapId ? (
        <APIProvider apiKey={mapsConfig.apiKey}>
          <MapUpdater selectedChurch={selectedChurchFromHud} />
          <Map
            mapId={mapsConfig.mapId}
            defaultCenter={geolocation?.location ? { lat: geolocation.location.latitude, lng: geolocation.location.longitude } : { lat: 0, lng: 0 }}
            defaultZoom={geolocation?.location ? 12 : 2}
            gestureHandling={'greedy'}
            zoomControl={false}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            className="w-full h-full border-0 rounded-lg"
            onClick={() => onChurchSelect(null)}
          >
            {churches
              ?.filter(church => typeof church.latitude === 'number' && typeof church.longitude === 'number')
              .map((church) => (
                <AdvancedMarker
                  key={church.id}
                  position={{ lat: church.latitude, lng: church.longitude }}
                  title={church.name}
                  onClick={() => { onChurchSelect(church); setConfirmationChurchId(null); }}
                >
                  <img src="/assets/ping.svg" alt="Church Location" className="w-14 h-14 transform -translate-x-1/2 -translate-y-1/2" />
                </AdvancedMarker>
              ))}
          </Map>
        </APIProvider>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground text-center p-4">
            Please set up Google Maps API keys to enable the interactive map.
          </p>
        </div>
      )}

      {/* Side Panel for Church Details */}
      <div className={cn("absolute bg-card/50 backdrop-blur-[5px] z-10 transform transition-transform duration-300 ease-in-out shadow-lg",
        "w-full h-auto max-h-[85vh] bottom-0 left-0 rounded-t-xl border-t border-white/10", // Mobile: Bottom sheet
        "md:top-0 md:right-0 md:left-auto md:h-full md:w-80 md:rounded-none md:border-l md:border-t-0", // Desktop: Side panel
        selectedChurchFromHud
          ? "translate-y-0 md:translate-x-0"
          : "translate-y-full md:translate-x-full"
      )}>
        {selectedChurchFromHud && (
          <div className="p-6 h-full flex flex-col">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => onChurchSelect(null)}>
              <X className="h-5 w-5" />
            </Button>
            <h3 className="font-bold text-2xl mb-4 pr-10">{selectedChurchFromHud.name}</h3>

            <div className="space-y-3 text-muted-foreground text-sm flex-grow">
              <div className="flex items-start gap-3">
                <Hourglass className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{selectedChurchFromHud.meetingSchedule}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>
                  {selectedChurchFromHud.reservations?.length || 0} / {selectedChurchFromHud.personLimit || '∞'} {t('contentPreview.registerChurch.spots')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("w-2.5 h-2.5 rounded-full", getStatusColor(selectedChurchFromHud.status))} />
                <span>{getTranslatedStatus(selectedChurchFromHud.status, t)}</span>
              </div>
            </div>

            <div className="py-4 border-y my-4">
              <p className="text-sm font-semibold mb-3">{t('contentPreview.registerChurch.hostInfo')}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedChurchFromHud.creatorName || t('contentPreview.registerChurch.host')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedChurchFromHud.creatorEmail || t('contentPreview.registerChurch.noEmail')}</span>
                </div>
                {selectedChurchFromHud.whatsappNumber && (
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedChurchFromHud.whatsappNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-6">
              {confirmationChurchId === selectedChurchFromHud.id ? (
                <div className="space-y-2 text-center">
                  <p className="text-sm font-semibold">{t('contentPreview.registerChurch.confirmReservation')}</p>
                  <div className="flex justify-around">
                    <Button size="sm" onClick={() => handleReserveSpot(selectedChurchFromHud.id)}>{t('contentPreview.registerChurch.yesConfirm')}</Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmationChurchId(null)}>{t('contentPreview.registerChurch.cancel')}</Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => setConfirmationChurchId(selectedChurchFromHud.id)}
                  disabled={
                    !user ||
                    selectedChurchFromHud.status !== 'Open' ||
                    (selectedChurchFromHud.personLimit && (selectedChurchFromHud.reservations?.length || 0) >= selectedChurchFromHud.personLimit) ||
                    (selectedChurchFromHud.reservations?.includes(user?.id))
                  }
                >
                  {!user ? t('contentPreview.registerChurch.loginToBook')
                    : selectedChurchFromHud.reservations?.includes(user?.id) ?
                      <><CheckCircle className="mr-2" /> {t('contentPreview.registerChurch.reserved')}</>
                      : (selectedChurchFromHud.personLimit && (selectedChurchFromHud.reservations?.length || 0) >= selectedChurchFromHud.personLimit) ?
                        <><XCircle className="mr-2" /> {t('contentPreview.registerChurch.noSpots')}</>
                        : selectedChurchFromHud.status !== 'Open' ?
                          <><XCircle className="mr-2" /> {t('contentPreview.registerChurch.notOpen')}</>
                          : t('contentPreview.registerChurch.bookSpotButton')
                  }
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
ChurchMap.displayName = 'ChurchMap';

// --- Main Component ---

export default function FindHomeChurchContent() {
  const { t } = useTranslation();
  const { user } = useUser();
  const geolocation = useContext(GeolocationContext);
  const supabase = useSupabaseClient();

  const [churches, setChurches] = useState<any[]>([]);
  const [selectedChurchFromHud, setSelectedChurchFromHud] = useState<any | null>(null);
  const [filters, setFilters] = useState({ searchQuery: '', statusFilter: 'all', countryFilter: 'all', dayFilter: 'all', timeFilter: 'all' });

  useEffect(() => {
    const fetchChurches = async () => {
      const { data, error } = await supabase.from('home_churches').select('*');
      if (error) {
        console.error('Error fetching churches:', error);
      } else {
        setChurches(data);
      }
    };

    fetchChurches();

    const channel = supabase
      .channel('realtime:public:home_churches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'home_churches' },
        (payload) => {
          fetchChurches();
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const availableCountries = useMemo(() => {
    if (!churches) return [];
    return Array.from(new Set(churches.map(c => c.country).filter(Boolean))).sort() as string[];
  }, [churches]);

  const filteredChurches = useMemo(() => {
    if (!churches) return [];
    return churches.filter(church => {
      const searchLower = filters.searchQuery.toLowerCase();
      const nameMatch = church.name.toLowerCase().includes(searchLower);
      const neighborhoodMatch = church.neighborhood?.toLowerCase().includes(searchLower);
      const tagsMatch = church.tags && Array.isArray(church.tags) && church.tags.some((tag: string) => tag.toLowerCase().includes(searchLower));

      const statusMatch = filters.statusFilter === 'all' || church.status === filters.statusFilter;
      const countryMatch = !filters.countryFilter || filters.countryFilter === 'all' || church.country === filters.countryFilter;

      const churchDay = getChurchDay(church.meetingDate);
      const dayMatch = filters.dayFilter === 'all' || churchDay === filters.dayFilter;

      let timeMatch = true;
      if (filters.timeFilter !== 'all') {
        const hour = parseMeetingHour(church.meetingTime);
        if (hour !== -1) {
          if (filters.timeFilter === 'morning') timeMatch = hour >= 6 && hour < 12;
          else if (filters.timeFilter === 'afternoon') timeMatch = hour >= 12 && hour < 18;
          else if (filters.timeFilter === 'evening') timeMatch = hour >= 18 || hour < 6;
        }
      }

      return (nameMatch || neighborhoodMatch || tagsMatch) && statusMatch && countryMatch && dayMatch && timeMatch;
    });
  }, [churches, filters]);

  return (
    <div className="PreviewContent p-0 h-full w-full flex flex-col">
      <div className="flex-grow relative h-full w-full">
        <ChurchMap
          churches={filteredChurches as any[]}
          geolocation={geolocation}
          user={user}
          selectedChurchFromHud={selectedChurchFromHud}
          onChurchSelect={setSelectedChurchFromHud}
        />
        <ChurchesListHUD
          churches={filteredChurches as any[]}
          availableCountries={availableCountries}
          onChurchSelect={setSelectedChurchFromHud}
          onFilterChange={setFilters as any}
        />
      </div>
    </div>
  );
}
