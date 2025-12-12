
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
  country: z.string().optional().transform(val => val ? sanitize(val) : val),
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
      country: "",
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
      country,
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
      country: values.country,
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
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FloatingLabelInput field={field} label={t('Country')} placeholder=" " /></FormItem>
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

  return (
    <div className="PreviewContent p-4 md:p-8 text-foreground h-full flex flex-col">
      <RegistrationForm geolocation={geolocation} toast={toast} t={t} user={user} />
    </div>
  );
}








