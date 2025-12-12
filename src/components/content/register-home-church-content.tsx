
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateEmailHtml } from '@/lib/email-templates';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/firebase";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import React, { useContext, useMemo, useState, useEffect, useCallback } from "react";
import { GeolocationContext } from "@/context/GeolocationContext";
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";

import { mapsConfig } from "@/lib/maps-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CalendarIcon, MapPin, Users, Building2, Hourglass, CheckCircle, XCircle, X, Search, User as UserIcon, Mail, Smartphone } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es, fr, pt } from 'date-fns/locale';
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSupabaseClient } from '@supabase/auth-helpers-react';


// Sanitize function to remove HTML tags
const sanitize = (str: string) => str.replace(/<[^>]*>?/gm, '');



const formSchema = z.object({
  creator_name: z.string().min(2, "Name is required").transform(sanitize),
  creator_email: z.string().email("Valid email is required").transform(sanitize),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).transform(sanitize),
  phone_number: z.string().min(10, { message: "Phone number must be at least 10 digits." }).transform(sanitize),
  email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  whatsapp_number: z.string().optional().transform(val => val ? sanitize(val) : val),
  website_url: z.string().optional().transform(e => e === "" ? undefined : e).transform(e => e && !e.startsWith('http') ? `https://${e}` : e).pipe(z.string().url({ message: "Please enter a valid URL." }).optional()),
  neighborhood: z.string().optional().transform(val => val ? sanitize(val) : val),
  tags: z.string().optional().transform(val => val ? sanitize(val) : val),
  person_limit: z.coerce.number().min(1, "Limit must be at least 1.").optional(),
  status: z.string().min(1, { message: "Please select a status." }),
  meeting_date: z.date({ required_error: "A date is required." }),
  hour: z.string().min(1, "Hour is required"),
  minute: z.string().min(1, "Minute is required"),
  ampm: z.string().optional(),
  is_recurring: z.boolean().default(true),
}).refine(data => {
  return !!data.email || !!data.whatsapp_number || !!data.website_url || !!data.neighborhood;
}, {
  message: "At least one contact method or the neighborhood must be provided.",
  path: ["email"],
});

const FloatingLabelInput = ({ field, label, placeholder, type = "text" }: { field: any, label: string, placeholder: string, type?: string }) => (
  <div className="relative">
    <FormControl>
      <Input type={type} placeholder={placeholder} {...field} className="peer h-10 pt-4" />
    </FormControl>
    <FormLabel className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-focus:text-primary", (field.value && String(field.value).length > 0) && "top-2.5 -translate-y-1/2 scale-75 text-primary")}>
      {label}
    </FormLabel>
  </div>
);

const ChurchesListHUD = ({ churches, onChurchSelect, onFilterChange }: { churches: any[], onChurchSelect: (church: any) => void, onFilterChange: (filters: { searchQuery: string, statusFilter: string }) => void }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleFilterChange = (newSearchQuery: string, newStatusFilter: string) => {
    setSearchQuery(newSearchQuery);
    setStatusFilter(newStatusFilter);
    onFilterChange({ searchQuery: newSearchQuery, statusFilter: newStatusFilter });
  };


  if (!churches) {
    return null;
  }

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

  const statusOptions = [
    { value: 'all', label: t('events.all') },
    { value: 'Open', label: t('contentPreview.registerChurch.statusOptions.open') },
    { value: 'Full', label: t('contentPreview.registerChurch.statusOptions.full') },
    { value: 'Closed', label: t('contentPreview.registerChurch.statusOptions.closed') },
    { value: 'Temporarily Closed', label: t('contentPreview.registerChurch.statusOptions.tempClosed') },
    { value: 'Suspended', label: t('contentPreview.registerChurch.statusOptions.suspended') },
  ];

  return (
    <div className="absolute top-4 left-4 z-10 w-[calc(100%-2rem)] max-w-sm md:w-80 transition-all duration-300">
      <Card className="bg-card/50 backdrop-blur-[5px] max-h-[50vh] flex flex-col shadow-sm border-0 md:border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-semibold md:text-xl">{t('contentPreview.registerChurch.upcomingMeetings')}</CardTitle>
          <div className="flex gap-2 pt-1 items-center">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t('events.searchPlaceholder')}
                className="pl-8 h-9 text-sm bg-background/60"
                value={searchQuery}
                onChange={(e) => handleFilterChange(e.target.value, statusFilter)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange(searchQuery, value)}>
              <SelectTrigger className="w-[40px] px-0 justify-center h-9 bg-background/60">
                <Filter className="h-4 w-4" />
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
                      <span className="text-[10px] text-muted-foreground">{church.status}</span>
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

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
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
                  {selectedChurchFromHud.reservations?.length || 0} / {selectedChurchFromHud.personLimit || '∞'} Spots
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("w-2.5 h-2.5 rounded-full", getStatusColor(selectedChurchFromHud.status))} />
                <span>{selectedChurchFromHud.status}</span>
              </div>
            </div>

            <div className="py-4 border-y my-4">
              <p className="text-sm font-semibold mb-3">Host Information</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedChurchFromHud.creatorName || 'Host'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedChurchFromHud.creatorEmail || "No email provided"}</span>
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
                  <p className="text-sm font-semibold">Confirm Reservation?</p>
                  <div className="flex justify-around">
                    <Button size="sm" onClick={() => handleReserveSpot(selectedChurchFromHud.id)}>Yes, Confirm</Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmationChurchId(null)}>Cancel</Button>
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
                  {!user ? "Login to book"
                    : selectedChurchFromHud.reservations?.includes(user?.id) ?
                      <><CheckCircle className="mr-2" /> Reserved</>
                      : (selectedChurchFromHud.personLimit && (selectedChurchFromHud.reservations?.length || 0) >= selectedChurchFromHud.personLimit) ?
                        <><XCircle className="mr-2" /> No spots available</>
                        : selectedChurchFromHud.status !== 'Open' ?
                          <><XCircle className="mr-2" /> Not Open</>
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

const RegistrationForm = React.memo(({ geolocation, toast, t, user }: { geolocation: any, toast: any, t: (key: string, options?: any) => string, user: any }) => {
  const { locale } = useTranslation();
  const supabase = useSupabaseClient();
  const dateLocales: { [key: string]: any } = { es, fr, pt };
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');

  const statusOptions = [
    { value: 'Open', label: t('contentPreview.registerChurch.statusOptions.open') },
    { value: 'Full', label: t('contentPreview.registerChurch.statusOptions.full') },
    { value: 'Closed', label: t('contentPreview.registerChurch.statusOptions.closed') },
    { value: 'Temporarily Closed', label: t('contentPreview.registerChurch.statusOptions.tempClosed') },
    { value: 'Suspended', label: t('contentPreview.registerChurch.statusOptions.suspended') },
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creator_name: user?.user_metadata?.full_name || "",
      creator_email: user?.email || "",
      name: "",
      phone_number: "",
      email: "",
      whatsapp_number: "",
      website_url: "",
      neighborhood: "",
      tags: "",
      person_limit: undefined,
      status: "Open",
      meeting_date: undefined,
      hour: "19",
      minute: "00",
      ampm: "PM",
      is_recurring: true,
    },
  });

  // Update default values when user loads
  useEffect(() => {
    if (user) {
      form.setValue('creator_name', user.user_metadata?.full_name || "");
      form.setValue('creator_email', user.email || "");
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!geolocation?.location || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Location or user not available. Please try again later.",
      });
      return;
    }

    if (!supabase) {
      toast({ variant: "destructive", title: "Error", description: "Database not available." });
      return;
    }

    const meetingTime = timeFormat === '12h'
      ? `${values.hour.padStart(2, '0')}:${values.minute.padStart(2, '0')} ${values.ampm}`
      : `${values.hour.padStart(2, '0')}:${values.minute.padStart(2, '0')}`;

    let scheduleString = "";
    if (values.is_recurring) {
      const dayOfWeek = format(values.meeting_date, "EEEE", { locale: dateLocales[locale || 'en'] });
      scheduleString = t('contentPreview.registerChurch.recurringSchedule', { day: dayOfWeek, time: meetingTime });
    } else {
      const formattedDate = format(values.meeting_date, "PPP", { locale: dateLocales[locale || 'en'] });
      scheduleString = t('contentPreview.registerChurch.oneTimeSchedule', { date: formattedDate, time: meetingTime });
    }

    const {
      person_limit,
      creator_name,
      creator_email,
      hour,
      minute,
      ampm,
      is_recurring,
      meeting_date,
      phone_number,
      whatsapp_number,
      website_url,
      tags,
      ...restOfValues
    } = values;

    const dataToSave = {
      ...restOfValues,
      creatorId: user.id,
      creatorName: values.creator_name,
      creatorEmail: values.creator_email,
      personLimit: values.person_limit ? Number(values.person_limit) : null,
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
      latitude: Number(geolocation.location.latitude),
      longitude: Number(geolocation.location.longitude),
      reservations: [],
      isFull: false,
      meetingSchedule: scheduleString,
      meetingTime: meetingTime,
      meetingDate: values.meeting_date.toISOString(),
      phoneNumber: values.phone_number,
      whatsappNumber: values.whatsapp_number,
      websiteUrl: values.website_url,
      isRecurring: values.is_recurring,
    };

    try {
      const { error } = await supabase.from('home_churches').insert([dataToSave]);

      if (error) throw error;

      try {
        const emailHtml = generateEmailHtml(
          'Your church is now part of the community!',
          `
            <p>Hello,</p>
            <p>Great news! You have successfully registered a new home church on <strong>Christianitatis</strong>. Thank you for opening your home.</p>
            
            <div class="info-box" style="text-align: left;">
            <h3 style="margin-top: 0; color: #1e293b;">Church Details</h3>
            <ul style="padding-left: 20px; color: #334155;">
                <li><strong>Name:</strong> ${dataToSave.name}</li>
                <li><strong>Schedule:</strong> ${scheduleString}</li>
                <li><strong>People Limit:</strong> ${values.person_limit ? values.person_limit : 'No limit'}</li>
            </ul>
            </div>

            <p>Your church is now visible on the map for other users to find and book a visit.</p>
            
            <p style="margin-bottom: 25px;">Remember to check your profile to manage reservations.</p>
            
            <div style="text-align: center;">
            <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/profile" class="button">Manage my Church</a>
            </div>
            `
        );

        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: 'Your church has been created - Christianitatis',
            html: emailHtml
          })
        });
      } catch (e) {
        console.error("Failed to send creation email", e);
        // Don't block user flow if email fails
      }

      toast({
        title: t('contentPreview.registerChurch.toastTitle'),
        description: t('contentPreview.registerChurch.toastDescription'),
      });
      form.reset();
    } catch (error: any) {
      console.error("Error details:", JSON.stringify(error, null, 2));
      toast({
        variant: "destructive",
        title: "Error creating church",
        description: error.message || error.details || "Failed to create home church. Check console for details.",
      });
    }
  }

  if (!user) {
    return (
      <Card className="h-full flex flex-col items-center justify-center">
        <CardContent className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t('contentPreview.registerChurch.loginPrompt')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-center text-3xl">{t('contentPreview.registerChurch.title')}</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FloatingLabelInput field={field} label={t('contentPreview.registerChurch.name')} placeholder=" " />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FloatingLabelInput field={field} label={t('contentPreview.registerChurch.phone')} placeholder=" " />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">{t('contentPreview.registerChurch.sessionInfo')}</p>
                <div className="space-y-4 p-4 border rounded-lg">
                  <FormField control={form.control} name="creator_name" render={({ field }) => (
                    <FormItem><FloatingLabelInput field={field} label={t('Creator Name')} placeholder=" " /></FormItem>
                  )} />
                  <FormField control={form.control} name="creator_email" render={({ field }) => (
                    <FormItem><FloatingLabelInput field={field} label={t('Creator Email')} placeholder=" " /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FloatingLabelInput field={field} label={t('contentPreview.registerChurch.email')} placeholder=" " /></FormItem>
                  )} />
                  <FormField control={form.control} name="whatsapp_number" render={({ field }) => (
                    <FormItem><FloatingLabelInput field={field} label={t('contentPreview.registerChurch.whatsapp')} placeholder=" " /></FormItem>
                  )} />
                  <FormField control={form.control} name="website_url" render={({ field }) => (
                    <FormItem><FloatingLabelInput field={field} label={t('contentPreview.registerChurch.website')} placeholder=" " /></FormItem>
                  )} />
                  <FormField control={form.control} name="neighborhood" render={({ field }) => (
                    <FormItem><FloatingLabelInput field={field} label={t('contentPreview.registerChurch.neighborhood')} placeholder=" " /></FormItem>
                  )} />
                </div>
                <FormMessage className="mt-1">{form.formState.errors.email?.message}</FormMessage>
              </div>

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FloatingLabelInput field={field} label={t('contentPreview.registerChurch.tags')} placeholder=" " />
                    <FormDescription className="px-1">{t('contentPreview.registerChurch.tagsDescription')}</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="person_limit"
                render={({ field }) => (
                  <FormItem>
                    <FloatingLabelInput type="number" field={{ ...field, value: field.value === 0 ? '' : field.value || '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10)) }} label={t('contentPreview.registerChurch.peopleLimit')} placeholder=" " />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">{t('contentPreview.registerChurch.scheduleTitle')}</p>
                <div className="space-y-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name="meeting_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: dateLocales[locale || 'en'] })
                                ) : (
                                  <span>{t('contentPreview.registerChurch.pickDate')}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Time Format</Label>
                    <RadioGroup defaultValue="24h" onValueChange={(value: '12h' | '24h') => setTimeFormat(value)} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="24h" id="r24h" />
                        <Label htmlFor="r24h">24-hour</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="12h" id="r12h" />
                        <Label htmlFor="r12h">12-hour</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex items-center gap-2">
                    <FormField control={form.control} name="hour" render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Hour" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Array.from({ length: timeFormat === '12h' ? 12 : 24 }, (_, i) => {
                              const hour = timeFormat === '12h' ? i + 1 : i;
                              return <SelectItem key={hour} value={String(hour)}>{String(hour).padStart(2, '0')}</SelectItem>
                            })}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <span>:</span>
                    <FormField control={form.control} name="minute" render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Minute" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => (
                              <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    {timeFormat === '12h' && (
                      <FormField control={form.control} name="ampm" render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="AM/PM" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name="is_recurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {t('contentPreview.registerChurch.recurringMeeting')}
                          </FormLabel>
                          <FormDescription>
                            {t('contentPreview.registerChurch.recurringDescription')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>


              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contentPreview.registerChurch.status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('contentPreview.registerChurch.statusPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg">
                {t('contentPreview.registerChurch.submitButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </ScrollArea>
    </Card>
  );
});
RegistrationForm.displayName = 'RegistrationForm';


export default function RegisterHomeChurchContent() {
  const { t } = useTranslation();
  const { user } = useUser();
  const geolocation = useContext(GeolocationContext);
  const { toast } = useToast();
  const supabase = useSupabaseClient();

  const [churches, setChurches] = useState<any[]>([]);
  const [selectedChurchFromHud, setSelectedChurchFromHud] = useState<any | null>(null);
  const [filters, setFilters] = useState({ searchQuery: '', statusFilter: 'all' });

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
          console.log('Change received!', payload)
          fetchChurches(); // Refetch all on change
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filteredChurches = useMemo(() => {
    if (!churches) return [];
    return churches.filter(church => {
      const searchLower = filters.searchQuery.toLowerCase();
      const nameMatch = church.name.toLowerCase().includes(searchLower);
      const neighborhoodMatch = church.neighborhood?.toLowerCase().includes(searchLower);
      const tagsMatch = church.tags && Array.isArray(church.tags) && church.tags.some((tag: string) => tag.toLowerCase().includes(searchLower));

      const statusMatch = filters.statusFilter === 'all' || church.status === filters.statusFilter;

      return (nameMatch || neighborhoodMatch || tagsMatch) && statusMatch;
    });
  }, [churches, filters]);

  return (
    <div className="PreviewContent p-4 md:p-8 text-foreground h-full flex flex-col">
      <Tabs defaultValue="attend" className="w-full flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attend">{t('contentPreview.registerChurch.attendTab')}</TabsTrigger>
          <TabsTrigger value="create">{t('contentPreview.registerChurch.createTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="attend" className="flex-grow mt-4 relative">
          <ChurchMap churches={filteredChurches as any[]} geolocation={geolocation} user={user} selectedChurchFromHud={selectedChurchFromHud} onChurchSelect={setSelectedChurchFromHud} />
          <ChurchesListHUD churches={filteredChurches as any[]} onChurchSelect={setSelectedChurchFromHud} onFilterChange={setFilters} />
        </TabsContent>
        <TabsContent value="create" className="flex-grow mt-4">
          <RegistrationForm geolocation={geolocation} toast={toast} t={t} user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}








