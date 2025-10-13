
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { Home } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z.string().min(1, { message: "Please select a subject." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

export default function ContactPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const subjectOptions = [
    t('contact.subjects.general'),
    t('contact.subjects.prayer'),
    t('contact.subjects.event'),
    t('contact.subjects.volunteer'),
    t('contact.subjects.pastoral'),
    t('contact.subjects.website'),
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: t('contact.toastTitle'),
      description: t('contact.toastDescription'),
    });
    form.reset();
  }

  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="relative flex items-center justify-center">
            <CardTitle className="text-center text-3xl">{t('contact.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('contact.namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact.email')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('contact.emailPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact.subject')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('contact.subjectPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjectOptions.map((option) => (
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
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact.message')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('contact.messagePlaceholder')}
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {t('contact.sendMessage')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
