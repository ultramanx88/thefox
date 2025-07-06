import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Truck, Bike } from "lucide-react";
import Image from "next/image";
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

export default async function OrderTrackingPage({ params }: { params: { id: string, locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations('OrderTracking');

  const steps = [
    { name: t('stepVendorReceived'), icon: CheckCircle, status: 'completed' },
    { name: t('stepVendorPreparing'), icon: Package, status: 'completed' },
    { name: t('stepDriverPickup'), icon: Bike, status: 'active' },
    { name: t('stepOutForDelivery'), icon: Truck, status: 'pending' },
    { name: t('stepDelivered'), icon: CheckCircle, status: 'pending' },
  ];

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
                    <div className="ml-4">
                        <h4 className="font-semibold">{step.name}</h4>
                        <p className="text-sm text-muted-foreground">
                        {step.status === 'completed' && t('statusCompleted')}
                        {step.status === 'active' && t('statusInProgress')}
                        {step.status === 'pending' && t('statusPending')}
                        </p>
                    </div>
                    </div>
                ))}
                </div>
            </div>

            <div className="bg-muted rounded-lg overflow-hidden h-64 md:h-full">
                <Image
                    src="https://placehold.co/800x600.png"
                    data-ai-hint="map route"
                    alt={t('mapAlt')}
                    width={800}
                    height={600}
                    className="w-full h-full object-cover"
                />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
