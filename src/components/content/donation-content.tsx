
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import { CreditCard, Landmark, QrCode } from "lucide-react";

export default function DonationContent() {
  const { t } = useTranslation();

  return (
    <div className="PreviewContent flex flex-col items-center justify-center p-4 md:p-8 text-foreground">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t('contentPreview.donation.title')}</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('contentPreview.donation.description')}
          </p>
        </header>

        <main>
          <Tabs defaultValue="card" className="w-full">
            <TabsList className="grid w-full grid-cols-1 h-auto">
              <TabsTrigger value="card" className="py-2.5">
                <CreditCard className="mr-2" />
                {t('contentPreview.donation.card')}
              </TabsTrigger>
              <TabsTrigger value="transfer" className="py-2.5">
                <Landmark className="mr-2" />
                {t('contentPreview.donation.bank')}
              </TabsTrigger>
              <TabsTrigger value="pix" className="py-2.5">
                <QrCode className="mr-2" />
                {t('contentPreview.donation.pix')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="card" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('contentPreview.donation.payWithCard')}</CardTitle>
                  <CardDescription>
                    {t('contentPreview.donation.cardDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('contentPreview.donation.nameOnCard')}</Label>
                    <Input id="name" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">{t('contentPreview.donation.cardNumber')}</Label>
                    <Input id="cardNumber" placeholder="•••• •••• •••• ••••" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">{t('contentPreview.donation.expiry')}</Label>
                      <Input id="expiry" placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">{t('contentPreview.donation.cvc')}</Label>
                      <Input id="cvc" placeholder="•••" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">{t('contentPreview.donation.zip')}</Label>
                      <Input id="zip" placeholder="12345" />
                    </div>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="amount">{t('contentPreview.donation.amount')}</Label>
                      <Input id="amount" type="number" placeholder="50.00" />
                    </div>
                  <Button className="w-full" size="lg">{t('contentPreview.donation.donate')}</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transfer" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('contentPreview.donation.bankDetails')}</CardTitle>
                  <CardDescription>
                    {t('contentPreview.donation.bankDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contentPreview.donation.bankName')}:</span>
                    <span>Faithful Trust Bank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contentPreview.donation.bankHolder')}:</span>
                    <span>CHRISTIANITATIS MOVEMENT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contentPreview.donation.accountNumber')}:</span>
                    <span>123-456-7890</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contentPreview.donation.routingNumber')}:</span>
                    <span>0987654321</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contentPreview.donation.swift')}:</span>
                    <span>FTBXXXX</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-4">
                    {t('contentPreview.donation.memo')}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pix" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('contentPreview.donation.pixTransfer')}</CardTitle>
                  <CardDescription>
                    {t('contentPreview.donation.pixDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    {/* Placeholder for QR Code Image */}
                    <div className="w-48 h-48 bg-gray-300 flex items-center justify-center">
                      <p className="text-gray-500">QR Code</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{t('contentPreview.donation.pixKey')}</p>
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
