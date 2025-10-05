
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

const statusOptions = ["Open", "Closed", "Temporarily Closed", "Suspended"];

export default function RegisterHomeChurchContent() {
  const { toast } = useToast();
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
      title: "Registration Request Sent!",
      description: "You will receive a confirmation email shortly. Your registration will be validated by our team.",
    });
    form.reset();
  }

  return (
    <div className="PreviewContent flex flex-col items-center justify-center p-4 md:p-8 text-foreground">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl">Register a Home Church</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (with country code) *</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555-555-5555" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label>Session/Meeting Info (at least 1 required)</Label>
                <div className="grid grid-cols-1 gap-4 mt-2 p-4 border rounded-lg">
                    <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="contact@church.com" {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="contact_whatsapp"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                            <Input placeholder="+1 555-555-5555" {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="contact_website"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                            <Input placeholder="https://mychurch.org" {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Neighborhood</FormLabel>
                        <FormControl>
                            <Input placeholder="Downtown" {...field} />
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
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="#neighborhood #date #city" {...field} />
                    </FormControl>
                     <FormDescription>
                      Add tags to help people find your church.
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
                        <FormLabel>People Limit</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="20" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || '')} />
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
                        <FormLabel>Mark as Full</FormLabel>
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
                    <FormLabel>Meeting Schedule</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Every Friday at 7:00 PM"
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
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the church status" />
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
                 <h3 className="font-semibold">Upcoming Meetings Near You</h3>
                 <div className="text-center p-8 border rounded-lg mt-2">
                    <p className="text-muted-foreground">Location-based feature coming soon.</p>
                 </div>
              </div>


              <Button type="submit" className="w-full" size="lg">
                Submit for Validation
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
