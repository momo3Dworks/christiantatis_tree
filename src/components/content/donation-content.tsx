
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
          <Tabs defaultValue="transfer" className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 h-auto md:h-10">
              {/* <TabsTrigger value="card" className="py-2.5">
                <CreditCard className="mr-2" />
                {t('contentPreview.donation.card')}
              </TabsTrigger> */}
              <TabsTrigger value="transfer" className="py-2.5">
                <Landmark className="mr-2" />
                {t('contentPreview.donation.bank')}
              </TabsTrigger>
              <TabsTrigger value="pix" className="py-2.5">
                <QrCode className="mr-2" />
                {t('contentPreview.donation.pix')}
              </TabsTrigger>
            </TabsList>

            {/* <TabsContent value="card" className="mt-6">
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
                  <div className="grid grid-cols-3 gap-4">
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
            </TabsContent> */}

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
                    <span className="text-muted-foreground">{t('contentPreview.donation.bankInfo.bank')}:</span>
                    <span>BTG Pactual S.A. (208)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contentPreview.donation.bankInfo.name')}:</span>
                    <span>ASSOCIACAO CHRISTIANITATIS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contentPreview.donation.bankInfo.agency')}:</span>
                    <span>0050</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contentPreview.donation.bankInfo.account')}:</span>
                    <span>1847778-6</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-4">
                    {t('contentPreview.donation.memo')}
                  </p>
                  <p className="text-sm font-semibold text-center pt-2">
                    Enviar comprobantes de pago/transferencias al correo: info@christianitatis.org
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
                    <img src="/assets/Chirstianitatis_BankTransfer.png" alt="Donation QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-muted-foreground">{t('contentPreview.donation.pixKey')}</p>
                  <p className="font-mono bg-muted p-2 rounded-md">18.900.689/0001-76</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
