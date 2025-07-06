'use client';

import { ProductCard } from '@/components/ProductCard';
import { Rating } from '@/components/Rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { type Product, type Vendor } from '@/lib/types';
import { MapPin, Clock } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { getRegularHours } from '@/lib/hours';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

    checkClosingTime();
    const intervalId = setInterval(checkClosingTime, 60000);
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

interface VendorProfileClientProps {
    vendor: Vendor;
    products: Product[];
}

export function VendorProfileClient({ vendor, products }: VendorProfileClientProps) {
  const t = useTranslations('VendorProfile');
  
  return (
    <div>
        <div className="h-48 md:h-64 bg-muted relative">
            <Image src={vendor.bannerUrl} data-ai-hint="market stall fresh produce" alt={t('bannerAlt')} layout="fill" objectFit="cover" />
        </div>
        <div className="container mx-auto px-4 -mt-16">
            <div className="flex items-end space-x-4">
                <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src={vendor.avatarUrl} data-ai-hint="market vendor portrait" />
                    <AvatarFallback>{vendor.name.substring(0,2)}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="font-headline text-4xl font-bold">{vendor.name}</h1>
                    <div className="flex items-center space-x-4 text-muted-foreground mt-1">
                        <div className="flex items-center space-x-1"><MapPin className="w-4 h-4"/><span>{t('marketStall')}</span></div>
                        <Rating rating={vendor.rating} reviewCount={vendor.reviewCount} />
                    </div>
                </div>
            </div>
            
            <Separator className="my-8"/>
            
            <ClosingSoonAlert />

            <h2 className="text-2xl font-bold font-headline mb-4">{t('productsFrom', {vendorName: vendor.name})}</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                {products.map((product) => (
                <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    </div>
  );
}
