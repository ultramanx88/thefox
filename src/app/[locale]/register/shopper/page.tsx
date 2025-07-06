'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Bike, Car, Truck, FileText, User as UserIcon } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function DeliveryRegistrationPage() {
  const t = useTranslations('DriverRegistration');
  
  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <Truck className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-3xl">{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('fullNameLabel')}</Label>
                <Input id="fullName" placeholder={t('fullNamePlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phoneLabel')}</Label>
                <Input id="phone" type="tel" placeholder={t('phonePlaceholder')} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input id="email" type="email" placeholder={t('emailPlaceholder')} />
            </div>

            <div className="space-y-3 pt-2">
              <Label>{t('vehicleTypeLabel')}</Label>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Checkbox id="motorcycle" className="peer sr-only" />
                  <Label
                    htmlFor="motorcycle"
                    className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                  >
                    <Bike className="mb-3 h-6 w-6" />
                    {t('motorcycle')}
                  </Label>
                </div>
                <div>
                  <Checkbox id="car" className="peer sr-only" />
                  <Label
                    htmlFor="car"
                    className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                  >
                    <Car className="mb-3 h-6 w-6" />
                    {t('car')}
                  </Label>
                </div>
                 <div>
                  <Checkbox id="truck" className="peer sr-only" />
                  <Label
                    htmlFor="truck"
                    className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                  >
                    <Truck className="mb-3 h-6 w-6" />
                    {t('truck')}
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <div className="text-center">
                  <h3 className="text-lg font-medium">{t('documentsTitle')}</h3>
                  <p className="text-sm text-muted-foreground">{t('documentsDescription')}</p>
              </div>
              <div className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="idCard">{t('idCardLabel')}</Label>
                      <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input id="idCard" type="file" className="pl-10"/>
                      </div>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="driverLicense">{t('driverLicenseLabel')}</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input id="driverLicense" type="file" className="pl-10"/>
                      </div>
                  </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicleRegistration">{t('vehicleRegistrationLabel')}</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input id="vehicleRegistration" type="file" className="pl-10"/>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('vehicleRegistrationDescription')}</p>
                  </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-2 text-center">
                {t('approvalNotice')}
            </p>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
              {t('submitButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}