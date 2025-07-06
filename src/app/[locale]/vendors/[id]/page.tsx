'use client';

import { ProductCard } from '@/components/ProductCard';
import { Rating } from '@/components/Rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { type Product } from '@/lib/types';
import { MapPin, Clock } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { getRegularHours } from '@/lib/hours';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const mockVendorProducts: Product[] = [
    {
      id: '1',
      name: 'กะหล่ำปลีออร์แกนิก',
      price: 35.0,
      imageUrl: 'https://placehold.co/600x400.png',
      vendor: 'ร้านผักป้านี',
      rating: 4.8,
      reviewCount: 75,
      dataAiHint: 'cabbage vegetable',
    },
    {
      id: '6',
      name: 'มะนาวแป้น (ต่อ กก.)',
      price: 40.0,
      imageUrl: 'https://placehold.co/600x400.png',
      vendor: 'ร้านผักป้านี',
      rating: 4.9,
      reviewCount: 180,
      dataAiHint: 'lime fruit',
    },
];

function ClosingSoonAlert() {
  const t = useTranslations('VendorProfile');
  const [isClosingSoon, setIsClosingSoon] = useState(false);
  
  useEffect(() => {
    const checkClosingTime = async () => {
      try {
        const hoursData = await getRegularHours();
        const now = new Date();
        const dayMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const currentDayName = dayMap[now.getDay()];
        
        const todayHours = hoursData.find(h => h.day.toLowerCase() === currentDayName);

        if (todayHours && todayHours.isOpen) {
          const [closingHour, closingMinute] = todayHours.close.split(':').map(Number);
          
          const closingTime = new Date();
          closingTime.setHours(closingHour, closingMinute, 0, 0);

          const thirtyMinutesBeforeClosing = new Date(closingTime.getTime() - 30 * 60 * 1000);

          if (now >= thirtyMinutesBeforeClosing && now < closingTime) {
            setIsClosingSoon(true);
          } else {
            setIsClosingSoon(false);
          }
        } else {
          setIsClosingSoon(false);
        }
      } catch (error) {
        console.error("Failed to check closing time:", error);
        setIsClosingSoon(false);
      }
    };

    // Run once on mount, then every minute
    checkClosingTime();
    const intervalId = setInterval(checkClosingTime, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  if (!isClosingSoon) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-8 animate-pulse">
      <Clock className="h-4 w-4" />
      <AlertTitle>{t('closingSoonTitle')}</AlertTitle>
      <AlertDescription>
        {t('closingSoonDescription')}
      </AlertDescription>
    </Alert>
  );
}


export default function VendorProfilePage({ params }: { params: { id: string }}) {
  const t = useTranslations('VendorProfile');
  const vendorName = "ร้านผักป้านี";
  
  return (
    <div>
        <div className="h-48 md:h-64 bg-muted relative">
            <Image src="https://placehold.co/1600x400.png" data-ai-hint="market stall fresh produce" alt={t('bannerAlt')} layout="fill" objectFit="cover" />
        </div>
        <div className="container mx-auto px-4 -mt-16">
            <div className="flex items-end space-x-4">
                <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src="https://placehold.co/128x128.png" data-ai-hint="market vendor portrait" />
                    <AvatarFallback>PN</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="font-headline text-4xl font-bold">{vendorName}</h1>
                    <div className="flex items-center space-x-4 text-muted-foreground mt-1">
                        <div className="flex items-center space-x-1"><MapPin className="w-4 h-4"/><span>{t('marketStall')}</span></div>
                        <Rating rating={4.7} reviewCount={255} />
                    </div>
                </div>
            </div>
            
            <Separator className="my-8"/>
            
            <ClosingSoonAlert />

            <h2 className="text-2xl font-bold font-headline mb-4">{t('productsFrom', {vendorName})}</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                {mockVendorProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    </div>
  );
}
