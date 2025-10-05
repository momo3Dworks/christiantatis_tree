
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";

export default function FindHomeChurchContent() {
  return (
    <div className="PreviewContent flex flex-col items-center justify-center p-4 md:p-8 text-foreground h-full">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Find a Home Church</h1>
        </header>

        <main className="grid grid-cols-1 gap-8 h-full">
          {/* Map Section */}
          <div>
            <Card className="h-full min-h-[300px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/> Interactive Map</CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <div className="bg-muted rounded-lg h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Interactive map coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="br">Brazil</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input id="state" placeholder="e.g., California" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="e.g., San Francisco" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Neighborhood</Label>
                  <Input id="neighborhood" placeholder="e.g., Downtown" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closest">Closest Areas</Label>
                   <Input id="closest" placeholder="Search nearby areas" />
                </div>
                <Button className="w-full">Apply Filters</Button>
              </CardContent>
            </Card>
          </div>
        </main>
        
        {/* Results Section */}
        <section className="mt-12">
            <h2 className="text-3xl font-bold mb-6">Results</h2>
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Search results will appear here. Host information may include neighborhood, but host name is restricted for privacy.</p>
                </CardContent>
            </Card>
        </section>
      </div>
    </div>
  );
}
