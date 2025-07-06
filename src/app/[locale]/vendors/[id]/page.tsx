import { ProductCard } from '@/components/ProductCard';
import { Rating } from '@/components/Rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { type Product } from '@/lib/types';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

const mockVendorProducts: Product[] = [
    { id: '1', name: 'Organic Avocados', price: 4.99, imageUrl: 'https://placehold.co/600x400.png', vendor: 'Green Farms', rating: 4.5, reviewCount: 120, dataAiHint: "avocado fruit" },
    { id: '6', name: 'Fresh Sourdough Bread', price: 7.00, imageUrl: 'https://placehold.co/600x400.png', vendor: 'Green Farms', rating: 4.9, reviewCount: 95, dataAiHint: "sourdough bread" },
];

export default async function VendorProfilePage({ params }: { params: { id: string, locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations('VendorProfile');
  const vendorName = "Green Farms";
  
  return (
    <div>
        <div className="h-48 md:h-64 bg-muted relative">
            <Image src="https://placehold.co/1600x400.png" data-ai-hint="farm landscape" alt={t('bannerAlt')} layout="fill" objectFit="cover" />
        </div>
        <div className="container mx-auto px-4 -mt-16">
            <div className="flex items-end space-x-4">
                <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src="https://placehold.co/128x128.png" data-ai-hint="farmer portrait" />
                    <AvatarFallback>GF</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="font-headline text-4xl font-bold">{vendorName}</h1>
                    <div className="flex items-center space-x-4 text-muted-foreground mt-1">
                        <div className="flex items-center space-x-1"><MapPin className="w-4 h-4"/><span>{t('location')}</span></div>
                        <Rating rating={4.7} reviewCount={215} />
                    </div>
                </div>
            </div>
            
            <Separator className="my-8"/>

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
