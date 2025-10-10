
import { ProductCard } from '@/components/ProductCard';
import { HelloShared } from 'ui';
import { getProducts } from '@/lib/products';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import { getCategories } from '@/lib/categories';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  setRequestLocale('th');
  const t = await getTranslations({ namespace: 'HomePage' });
  const tCategories = await getTranslations({ namespace: 'Categories' });
  const categories = await getCategories();
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <HelloShared />
      <div className="mb-8 p-6 rounded-xl bg-emerald-50 border border-emerald-200">
        <h2 className="text-2xl font-bold text-emerald-700">ช้อปตลาดสด ใกล้บ้าน ส่งด่วน</h2>
        <p className="mt-2 text-emerald-800">เลือกวัตถุดิบสดใหม่จากร้านค้าที่คุณไว้ใจ เราจัดส่งถึงมือคุณ</p>
        <div className="mt-4 flex gap-2">
          <Link href="/vendors">
            <Button className="bg-emerald-600 hover:bg-emerald-700">เริ่มสั่งซื้อ</Button>
          </Link>
          <Link href="/vendors">
            <Button variant="outline">ดูร้านใกล้ฉัน</Button>
          </Link>
        </div>
      </div>
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
                        {tCategories(category.nameKey)}
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

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">หมวดหมู่ยอดนิยม</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.slice(0, 12).map((category) => (
            <div key={category.id} className="p-3 border rounded-lg bg-card text-center text-sm">
              {tCategories(category.nameKey)}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

