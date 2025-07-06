import { ProductCard } from '@/components/ProductCard';
import { type Product } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search } from 'lucide-react';
import {getTranslations, unstable_setRequestLocale} from 'next-intl/server';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Organic Avocados',
    price: 4.99,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Green Farms',
    rating: 4.5,
    reviewCount: 120,
    dataAiHint: 'avocado fruit',
  },
  {
    id: '2',
    name: 'Handmade Leather Wallet',
    price: 45.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Artisan Crafts',
    rating: 5.0,
    reviewCount: 89,
    dataAiHint: 'leather wallet',
  },
  {
    id: '3',
    name: 'Vintage T-Shirt',
    price: 25.5,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Retro Wears',
    rating: 4.0,
    reviewCount: 45,
    dataAiHint: 'vintage t-shirt',
  },
  {
    id: '4',
    name: 'Gourmet Coffee Beans',
    price: 18.75,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'The Daily Grind',
    rating: 4.8,
    reviewCount: 250,
    dataAiHint: 'coffee beans',
  },
  {
    id: '5',
    name: 'Wireless Headphones',
    price: 120.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Techify',
    rating: 4.7,
    reviewCount: 530,
    dataAiHint: 'wireless headphones',
  },
  {
    id: '6',
    name: 'Fresh Sourdough Bread',
    price: 7.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Bakery Bliss',
    rating: 4.9,
    reviewCount: 95,
    dataAiHint: 'sourdough bread',
  },
  {
    id: '7',
    name: 'Ceramic Plant Pot',
    price: 22.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Home Grown',
    rating: 4.6,
    reviewCount: 77,
    dataAiHint: 'ceramic pot',
  },
  {
    id: '8',
    name: 'Natural Soy Candle',
    price: 15.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Scented Escapes',
    rating: 4.8,
    reviewCount: 150,
    dataAiHint: 'soy candle',
  },
];

export default async function Home({params: {locale}}: {params: {locale: string}}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('HomePage');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="mb-8 p-4 sm:p-6 bg-card border rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2 space-y-2">
            <Label htmlFor="category">{t('categoryLabel')}</Label>
            <Select>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder={t('allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories')}</SelectItem>
                <SelectItem value="food">{t('foodCategory')}</SelectItem>
                <SelectItem value="clothing">{t('clothingCategory')}</SelectItem>
                <SelectItem value="household">{t('householdCategory')}</SelectItem>
                <SelectItem value="electronics">{t('electronicsCategory')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2 space-y-2">
            <Label htmlFor="location">{t('locationLabel')}</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="location" placeholder={t('locationPlaceholder')} className="pl-10" />
            </div>
          </div>
          <Button className="w-full bg-accent hover:bg-accent/90">
            <Search className="mr-2 h-4 w-4" /> {t('searchButton')}
          </Button>
        </div>
      </div>


      <Separator className="mb-8" />
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {mockProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
