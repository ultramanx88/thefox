
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Package, Home, CheckCircle } from "lucide-react";
import Image from "next/image";
import { getTranslations } from 'next-intl/server';

export default async function DeliveryJobPage({ params }: { params: { id: string, locale: string } }) {
  const t = await getTranslations('DeliveryJob');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          {t('subtitle', { orderId: params.id })}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-6 w-6 text-accent"/>
                        {t('pickupTitle')}
                    </CardTitle>
                    <CardDescription>{t('pickupDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-bold">ร้านผักป้านี</p>
                    <p className="text-muted-foreground">แผง A12, ตลาดคลองเตย</p>
                    <p className="text-muted-foreground">กรุงเทพมหานคร</p>
                    <Button variant="outline" className="mt-4 w-full">
                        <MapPin className="mr-2 h-4 w-4"/>
                        {t('getDirectionsButton')}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Home className="h-6 w-6 text-accent"/>
                        {t('deliveryTitle')}
                    </CardTitle>
                     <CardDescription>{t('deliveryDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-bold">ร้านอาหารเจริญสุข</p>
                    <p className="text-muted-foreground">123 ถนนสุขุมวิท, วัฒนา</p>
                    <p className="text-muted-foreground">กรุงเทพมหานคร 10110</p>
                    <Button variant="outline" className="mt-4 w-full">
                        <MapPin className="mr-2 h-4 w-4"/>
                        {t('getDirectionsButton')}
                    </Button>
                </CardContent>
            </Card>
            
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
                 <CheckCircle className="mr-2 h-5 w-5"/>
                {t('confirmDeliveryButton')}
            </Button>
        </div>
        <div className="md:col-span-2">
            <Card className="h-full">
                <CardContent className="p-2 h-full">
                     <div className="bg-muted rounded-lg overflow-hidden h-full min-h-[600px]">
                        <Image
                            src="https://placehold.co/800x1200.png"
                            data-ai-hint="map delivery route"
                            alt={t('mapAlt')}
                            width={800}
                            height={1200}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
