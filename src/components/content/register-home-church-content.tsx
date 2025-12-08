"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useSupabase, useUser } from "@/lib/supabase/provider";
import { useSupabaseCollection } from "@/lib/supabase/hooks/use-collection";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import React, { useContext, useMemo, useState } from "react";
import { GeolocationContext } from "@/context/GeolocationContext";
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { mapsConfig } from "@/lib/maps-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es, fr, pt } from 'date-fns/locale';
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

// Sanitize function to remove HTML tags
const sanitize = (str: string) => str.replace(/<[^>]*>?/gm, '');

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).transform(sanitize),
  phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits." }).transform(sanitize),
  email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  whatsappNumber: z.string().optional().transform(val => val ? sanitize(val) : val),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  neighborhood: z.string().optional().transform(val => val ? sanitize(val) : val),
  tags: z.string().optional().transform(val => val ? sanitize(val) : val),
  personLimit: z.coerce.number().min(1, "Limit must be at least 1.").optional(),
  status: z.string().min(1, { message: "Please select a status." }),
  meetingDate: z.date({ required_error: "A date is required." }),
  hour: z.string().min(1, "Hour is required"),
  minute: z.string().min(1, "Minute is required"),
  ampm: z.string().optional(),
  isRecurring: z.boolean().default(true),
}).refine(data => {
  return !!data.email || !!data.whatsappNumber || !!data.websiteUrl || !!data.neighborhood;
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

const ChurchMap = React.memo(({ churches, geolocation, user }: { churches: any[] | null, geolocation: any, user: any }) => {
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [selectedChurch, setSelectedChurch] = useState<any | null>(null);
  const [hoveredChurch, setHoveredChurch] = useState<any | null>(null);
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

    try {
      // Fetch latest church data to check availability
      const { data: church, error: fetchError } = await supabase
        .from('home_churches')
        .select('*')
        .eq('id', churchId)
        .single();

      if (fetchError || !church) throw new Error("Church not found or error fetching data.");

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

      const updatedReservations = [...reservations, user.id];

      const { error: updateError } = await supabase
        .from('home_churches')
        .update({ reservations: updatedReservations })
        .eq('id', churchId);

      if (updateError) throw updateError;

      console.log(`[SIMULACION] Enviando correo de confirmación de reserva a ${user.email} para la iglesia ${churchId}`);

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
      setSelectedChurch(null);
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
    <div className="relative w-full h-full">
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(0.95);
              opacity: 0.7;
            }
            70% {
              transform: scale(2.5);
              opacity: 0;
            }
            100% {
              transform: scale(0.95);
              opacity: 0;
            }
          }
          .pulse-animate {
            animation: pulse 2s infinite;
          }
        `}
      </style>
      {mapsConfig.apiKey && mapsConfig.mapId ? (
        <APIProvider apiKey={mapsConfig.apiKey}>
          <Map
            mapId={mapsConfig.mapId}
            defaultCenter={geolocation?.location ? { lat: geolocation.location.latitude, lng: geolocation.location.longitude } : { lat: 0, lng: 0 }}
            defaultZoom={geolocation?.location ? 12 : 2}
            gestureHandling={'greedy'}
            zoomControl={true}
            mapTypeControl={false}
            streetViewControl={false}
            className="w-full h-full border-0 rounded-lg"
          >
            {churches
              ?.filter(church => typeof church.latitude === 'number' && typeof church.longitude === 'number')
              .map((church) => (
                <AdvancedMarker
                  key={church.id}
                  position={{ lat: church.latitude, lng: church.longitude }}
                  title={church.name}
                  onClick={() => { setSelectedChurch(church); setConfirmationChurchId(null); }}
                  onMouseEnter={() => setHoveredChurch(church)}
                  onMouseLeave={() => setHoveredChurch(null)}
                >
                  <div className="relative flex items-center justify-center">
                    {hoveredChurch?.id === church.id && (
                      <svg
                        width="80"
                        height="80"
                        viewBox="0 0 80 80"
                        className="absolute"
                      >
                        <circle
                          cx="40"
                          cy="40"
                          r="20"
                          fill="rgba(255,215,0,0.5)"
                          className="pulse-animate"
                        />
                      </svg>
                    )}
                    <img
                      src="/assets/ping.svg"
                      width="30"
                      height="40"
                      alt="Church location"
                      style={{
                        transition: 'transform 0.2s ease-in-out',
                        transform: hoveredChurch?.id === church.id ? 'scale(1.4)' : 'scale(1)',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    />
                  </div>
                </AdvancedMarker>
              ))}
            {selectedChurch && (
              <InfoWindow
                position={{ lat: selectedChurch.latitude, lng: selectedChurch.longitude }}
                onCloseClick={() => setSelectedChurch(null)}
              >
                <div className="p-2 w-64">
                  <h3 className="font-bold text-lg mb-1">{selectedChurch.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{selectedChurch.meetingSchedule}</p>

                  <div className="flex justify-between items-center text-sm mb-3">
                    <span className={cn("font-semibold", {
                      "text-green-600": selectedChurch.status === 'Open',
                      "text-red-600": selectedChurch.status !== 'Open',
                    })}>{selectedChurch.status}</span>
                    {selectedChurch.personLimit && (
                      <span className="font-semibold">
                        {selectedChurch.reservations?.length || 0} / {selectedChurch.personLimit} Spots
                      </span>
                    )}
                  </div>

                  {confirmationChurchId === selectedChurch.id ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-center">Confirm Reservation?</p>
                      <div className="flex justify-around">
                        <Button size="sm" onClick={() => handleReserveSpot(selectedChurch.id)}>Yes</Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmationChurchId(null)}>No</Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => setConfirmationChurchId(selectedChurch.id)}
                      disabled={
                        !user ||
                        selectedChurch.status !== 'Open' ||
                        (selectedChurch.personLimit && (selectedChurch.reservations?.length || 0) >= selectedChurch.personLimit) ||
                        (selectedChurch.reservations?.includes(user?.id))
                      }
                    >
                      {!user ? "Login to book"
                        : selectedChurch.reservations?.includes(user?.id) ? "Already Reserved"
                          : (selectedChurch.personLimit && (selectedChurch.reservations?.length || 0) >= selectedChurch.personLimit) ? "No spots available"
                            : t('contentPreview.registerChurch.bookSpotButton')
                      }
                    </Button>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground text-center p-4">
            Please set up Google Maps API keys to enable the interactive map.
          </p>
        </div>
      )}
    </div>
  );
});
ChurchMap.displayName = 'ChurchMap';

const RegistrationForm = React.memo(({ geolocation, toast, t, user }: { geolocation: any, toast: any, t: (key: string, options?: any) => string, user: any }) => {
  const { locale } = useTranslation();
  const { supabase } = useSupabase();
  const dateLocales: { [key: string]: any } = { es, fr, pt };
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');

  const statusOptions = [
    t('contentPreview.registerChurch.statusOptions.open'),
    t('contentPreview.registerChurch.statusOptions.full'),
    t('contentPreview.registerChurch.statusOptions.closed'),
    t('contentPreview.registerChurch.statusOptions.tempClosed'),
    t('contentPreview.registerChurch.statusOptions.suspended'),
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      email: "",
      whatsappNumber: "",
      websiteUrl: "",
      neighborhood: "",
      tags: "",
      personLimit: undefined,
      status: "Open",
      meetingDate: undefined,
      hour: "19",
      minute: "00",
      ampm: "PM",
      isRecurring: true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!geolocation?.location || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Location or user not available. Please try again later.",
      });
      return;
    }

    const meetingTime = timeFormat === '12h'
      ? `${values.hour.padStart(2, '0')}:${values.minute.padStart(2, '0')} ${values.ampm}`
      : `${values.hour.padStart(2, '0')}:${values.minute.padStart(2, '0')}`;

    let scheduleString = "";
    if (values.isRecurring) {
      const dayOfWeek = format(values.meetingDate, "EEEE", { locale: dateLocales[locale || 'en'] });
      scheduleString = t('contentPreview.registerChurch.recurringSchedule', { day: dayOfWeek, time: meetingTime });
    } else {
      const formattedDate = format(values.meetingDate, "PPP", { locale: dateLocales[locale || 'en'] });
      scheduleString = t('contentPreview.registerChurch.oneTimeSchedule', { date: formattedDate, time: meetingTime });
    }

    const dataToSave = {
      ...values,
      creatorId: user.id, // Supabase user.id
      personLimit: values.personLimit ? Number(values.personLimit) : null,
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
      latitude: Number(geolocation.location.latitude),
      longitude: Number(geolocation.location.longitude),
      reservations: [],
      isFull: false,
      meetingSchedule: scheduleString,
      meetingTime: meetingTime,
      meetingDate: values.meetingDate,
    };

    // Remove form specific fields not needed in DB
    delete (dataToSave as any).hour;
    delete (dataToSave as any).minute;
    delete (dataToSave as any).ampm;


    const { error } = await supabase.from('home_churches').insert([dataToSave]);

    if (error) {
      console.error("Error creating church details: ", JSON.stringify(error, null, 2));
      toast({
        variant: "destructive",
        title: "Error creating church",
        description: error.message || error.details || "Failed to create home church. Check console for details.",
      });
      return;
    }

    console.log(`[SIMULACION] Enviando correo de confirmación de creación de iglesia a ${user.email} para la iglesia "${dataToSave.name}"`);

    toast({
      title: t('contentPreview.registerChurch.toastTitle'),
      description: t('contentPreview.registerChurch.toastDescription'),
    });
    form.reset();
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
                name="phoneNumber"
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
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FloatingLabelInput field={field} label={t('contentPreview.registerChurch.email')} placeholder=" " /></FormItem>
                  )} />
                  <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                    <FormItem><FloatingLabelInput field={field} label={t('contentPreview.registerChurch.whatsapp')} placeholder=" " /></FormItem>
                  )} />
                  <FormField control={form.control} name="websiteUrl" render={({ field }) => (
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
                name="personLimit"
                render={({ field }) => (
                  <FormItem>
                    <FloatingLabelInput type="number" field={{ ...field, value: field.value === 0 ? '' : field.value || '', onChange: (e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10)) }} label={t('contentPreview.registerChurch.peopleLimit')} placeholder=" " />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">{t('contentPreview.registerChurch.scheduleTitle')}</p>
                <div className="space-y-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name="meetingDate"
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
                    name="isRecurring"
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
                          <SelectItem key={option} value={option}>
                            {option}
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
  const { toast } = useToast();
  const { user } = useSupabase();
  const geolocation = useContext(GeolocationContext);

  const { data: churches } = useSupabaseCollection('home_churches');

  return (
    <div className="PreviewContent p-4 md:p-8 text-foreground h-full flex flex-col">
      <Tabs defaultValue="attend" className="w-full flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attend">{t('contentPreview.registerChurch.attendTab')}</TabsTrigger>
          <TabsTrigger value="create">{t('contentPreview.registerChurch.createTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="attend" className="flex-grow mt-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-center text-3xl">{t('contentPreview.registerChurch.upcomingMeetings')}</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-4rem)] p-0">
              <ChurchMap churches={churches as any[]} geolocation={geolocation} user={user} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="create" className="flex-grow mt-4">
          <RegistrationForm geolocation={geolocation} toast={toast} t={t} user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}