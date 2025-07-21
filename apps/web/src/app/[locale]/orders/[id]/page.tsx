import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, Truck, Bike } from "lucide-react";
import Image from "next/image";
import { getTranslations } from 'next-intl/server';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/Rating";
import { LanguageBadge } from "@/components/LanguageBadge";
import { OrderChat } from "@/components/OrderChat";

export default async function OrderTrackingPage({ params }: { params: { id: string, locale: string } }) {
  const t = await getTranslations('OrderTracking');

  const steps = [
    { name: t('stepVendorReceived'), icon: CheckCircle, status: 'completed' },
    { name: t('stepVendorPreparing'), icon: Package, status: 'completed' },
    { name: t('stepDriverPickup'), icon: Bike, status: 'active' },
    { name: t('stepOutForDelivery'), icon: Truck, status: 'pending' },
    { name: t('stepDelivered'), icon: CheckCircle, status: 'pending' },
  ];

  const driver = {
    name: 'สมชาย ใจดี',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'driver portrait',
    rating: 4.9,
    reviewCount: 89,
    vehicle: 'มอเตอร์ไซค์',
    languageBadges: ['ja', 'ko'] as ('ja' | 'ko' | 'zh')[],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{t('title')}</CardTitle>
          <p className="text-muted-foreground">{t('orderId')}: #{params.id}</p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">{t('statusTitle')}</h3>
                <div className="relative pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 ml-[12px]"></div>
                {steps.map((step, index) => (
                    <div key={index} className="relative mb-8 flex items-start">
                    <div className={`z-10 flex h-6 w-6 items-center justify-center rounded-full ${step.status === 'completed' ? 'bg-primary' : step.status === 'active' ? 'bg-accent animate-pulse' : 'bg-muted'}`}>
                        <step.icon className={`h-4 w-4 ${step.status === 'pending' ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
                    </div>
                    <div className="ml-4 w-full">
                        <h4 className="font-semibold">{step.name}</h4>
                        <p className="text-sm text-muted-foreground">
                        {step.status === 'completed' && t('statusCompleted')}
                        {step.status === 'active' && t('statusInProgress')}
                        {step.status === 'pending' && t('statusPending')}
                        </p>
                        
                        {(step.name === t('stepDriverPickup') || step.name === t('stepOutForDelivery')) && step.status !== 'pending' && (
                          <Card className="mt-4 bg-background/70">
                              <CardHeader className="p-4 flex flex-row items-center gap-4">
                                  <Avatar className="h-16 w-16">
                                      <AvatarImage src={driver.avatarUrl} alt={driver.name} data-ai-hint={driver.dataAiHint} />
                                      <AvatarFallback>{driver.name.slice(0,2)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <CardTitle className="text-lg">{t('driverProfileTitle')}</CardTitle>
                                      <p className="font-semibold mt-1">{driver.name}</p>
                                      <Rating rating={driver.rating} reviewCount={driver.reviewCount} className="mt-1" />
                                      {driver.languageBadges.length > 0 && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="text-xs text-muted-foreground">{t('driverLanguages')}:</span>
                                          {driver.languageBadges.map((lang) => (
                                              <LanguageBadge key={lang} lang={lang} />
                                          ))}
                                        </div>
                                      )}
                                  </div>
                              </CardHeader>
                          </Card>
                        )}
                    </div>
                    </div>
                ))}
                </div>
            </div>

            <div className="space-y-8">
                <OrderChat />
                <div className="bg-muted rounded-lg overflow-hidden h-64 md:h-[400px]">
                    <Image
                        src="https://placehold.co/800x600.png"
                        data-ai-hint="map route"
                        alt={t('mapAlt')}
                        width={800}
                        height={600}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
