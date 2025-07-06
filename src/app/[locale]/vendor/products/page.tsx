import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default async function VendorProductsPage({ params: { locale } }: { params: { locale: string }}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('VendorDashboard.main');

  return (
    <div>
        <h1 className="font-headline text-3xl font-bold mb-8">{t('productsTitle')}</h1>
        <Card>
            <CardHeader>
                <CardTitle>{t('allProducts')}</CardTitle>
                <CardDescription>{t('allProductsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <p>{t('productsPlaceholder')}</p>
            </CardContent>
        </Card>
    </div>
  );
}
