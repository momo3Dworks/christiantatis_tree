
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "../ui/label";
import { useTranslation } from "@/hooks/useTranslation";

const formSchema = z.object({
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  contact_email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  contact_whatsapp: z.string().optional(),
  contact_website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  neighborhood: z.string().optional(),
  tags: z.string().optional(),
  people_limit: z.coerce.number().min(1, "Limit must be at least 1.").optional(),
  is_full: z.boolean().default(false),
  schedule: z.string().min(5, { message: "Please describe the schedule." }),
  status: z.string().min(1, { message: "Please select a status." }),
}).refine(data => {
    return !!data.contact_email || !!data.contact_whatsapp || !!data.contact_website || !!data.neighborhood;
}, {
    message: "At least one contact method or the neighborhood must be provided.",
    path: ["contact_email"], // you can pick any of the fields to show the error
});

export default function RegisterHomeChurchContent() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const statusOptions = [
    t('contentPreview.registerChurch.statusOptions.open'),
    t('contentPreview.registerChurch.statusOptions.closed'),
    t('contentPreview.registerChurch.statusOptions.tempClosed'),
    t('contentPreview.registerChurch.statusOptions.suspended'),
  ];
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      contact_email: "",
      contact_whatsapp: "",
      contact_website: "",
      neighborhood: "",
      tags: "",
      people_limit: undefined,
      is_full: false,
      schedule: "",
      status: "Open",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: t('contentPreview.registerChurch.toastTitle'),
      description: t('contentPreview.registerChurch.toastDescription'),
    });
    form.reset();
  }

  return (
    <div className="PreviewContent flex flex-col items-center justify-center p-4 md:p-8 text-foreground">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl">{t('contentPreview.registerChurch.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contentPreview.registerChurch.phone')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('contentPreview.registerChurch.phonePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label>{t('contentPreview.registerChurch.sessionInfo')}</Label>
                <div className="grid grid-cols-1 gap-4 mt-2 p-4 border rounded-lg">
                    <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('contentPreview.registerChurch.email')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('contentPreview.registerChurch.emailPlaceholder')} {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="contact_whatsapp"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('contentPreview.registerChurch.whatsapp')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('contentPreview.registerChurch.whatsappPlaceholder')} {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="contact_website"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('contentPreview.registerChurch.website')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('contentPreview.registerChurch.websitePlaceholder')} {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('contentPreview.registerChurch.neighborhood')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('contentPreview.registerChurch.neighborhoodPlaceholder')} {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                </div>
                 <FormMessage>{form.formState.errors.contact_email?.message}</FormMessage>
              </div>

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contentPreview.registerChurch.tags')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('contentPreview.registerChurch.tagsPlaceholder')} {...field} />
                    </FormControl>
                     <FormDescription>
                      {t('contentPreview.registerChurch.tagsDescription')}
                    </FormDescription>
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 gap-6 items-center">
                <FormField
                    control={form.control}
                    name="people_limit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('contentPreview.registerChurch.peopleLimit')}</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder={t('contentPreview.registerChurch.peopleLimitPlaceholder')} {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || '')} />
                        </FormControl>
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="is_full"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-6">
                        <div className="space-y-0.5">
                        <FormLabel>{t('contentPreview.registerChurch.markAsFull')}</FormLabel>
                        </div>
                        <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        </FormControl>
                    </FormItem>
                    )}
                />
            </div>

              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contentPreview.registerChurch.schedule')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('contentPreview.registerChurch.schedulePlaceholder')}
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />

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

              <div className="pt-4">
                 <h3 className="font-semibold">{t('contentPreview.registerChurch.upcomingMeetings')}</h3>
                 <div className="text-center p-8 border rounded-lg mt-2">
                    <p className="text-muted-foreground">{t('contentPreview.registerChurch.locationFeaturePlaceholder')}</p>
                 </div>
              </div>


              <Button type="submit" className="w-full" size="lg">
                {t('contentPreview.registerChurch.submitButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
