
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Landmark, QrCode } from "lucide-react";

export default function DonationContent() {
  return (
    <div className="PreviewContent flex flex-col items-center justify-center p-4 md:p-8 text-foreground">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Support the Movement</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your generosity fuels our mission to spread the message and support communities in need.
            Every contribution, big or small, makes a significant impact.
          </p>
        </header>

        <main>
          <Tabs defaultValue="card" className="w-full">
            <TabsList className="grid w-full grid-cols-1 h-auto">
              <TabsTrigger value="card" className="py-2.5">
                <CreditCard className="mr-2" />
                Credit/Debit Card
              </TabsTrigger>
              <TabsTrigger value="transfer" className="py-2.5">
                <Landmark className="mr-2" />
                Bank Transfer
              </TabsTrigger>
              <TabsTrigger value="pix" className="py-2.5">
                <QrCode className="mr-2" />
                PIX
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="card" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pay with Card</CardTitle>
                  <CardDescription>
                    Enter your card details below. We accept all major credit and debit cards.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name on Card</Label>
                    <Input id="name" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input id="cardNumber" placeholder="•••• •••• •••• ••••" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry</Label>
                      <Input id="expiry" placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" placeholder="•••" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input id="zip" placeholder="12345" />
                    </div>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="amount">Amount (USD)</Label>
                      <Input id="amount" type="number" placeholder="50.00" />
                    </div>
                  <Button className="w-full" size="lg">Donate</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transfer" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bank Transfer Details</CardTitle>
                  <CardDescription>
                    Use the details below to make a direct bank transfer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank Name:</span>
                    <span>Faithful Trust Bank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Holder:</span>
                    <span>CHRISTIANITATIS MOVEMENT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Number:</span>
                    <span>123-456-7890</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Routing Number:</span>
                    <span>0987654321</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SWIFT Code (for international):</span>
                    <span>FTBXXXX</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-4">
                    Please include "General Donation" in the memo or reference field of your transfer.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pix" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>PIX Transfer</CardTitle>
                  <CardDescription>
                    Scan the QR code or use the PIX key below for an instant transfer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    {/* Placeholder for QR Code Image */}
                    <div className="w-48 h-48 bg-gray-300 flex items-center justify-center">
                      <p className="text-gray-500">QR Code</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">Or use the PIX key:</p>
                  <p className="font-mono bg-muted p-2 rounded-md">donations@christianitatis.org</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
