import { ProductCard } from '@/components/ProductCard';
import { getProducts } from '@/lib/products';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search } from 'lucide-react';
import {getTranslations, unstable_setRequestLocale} from 'next-intl/server';
import { getCategories } from '@/lib/categories';
import type { Metadata } from 'next';

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'HomePage'});
 
  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      images: ['/og-image.png'] // Replace with a real URL to a generic OG image
    }
  };
}


export default async function Home({params: {locale}}: {params: {locale: string}}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('HomePage');
  const categories = await getCategories();
  const products = await getProducts();

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4 items-end">
          <div className="md:col-span-2 lg:col-span-3 space-y-2">
            <Label htmlFor="search">{t('searchLabel')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="search" placeholder={t('searchPlaceholder')} className="pl-10" />
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-2">
            <Label htmlFor="category">{t('categoryLabel')}</Label>
            <Select>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder={t('allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories')}</SelectItem>
                {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                        {category.name}
                    </SelectItem>
                ))}
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
          <Button className="w-full lg:col-span-1 bg-accent hover:bg-accent/90">
            <Search className="mr-2 h-4 w-4" /> {t('searchButton')}
          </Button>
        </div>
      </div>


      <Separator className="mb-8" />
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
