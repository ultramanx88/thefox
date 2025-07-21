import { getTranslations } from 'next-intl/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default async function VendorOrdersPage({ params: { locale } }: { params: { locale: string }}) {
  const t = await getTranslations('VendorDashboard.main');

  return (
    <div>
        <h1 className="font-headline text-3xl font-bold mb-8">{t('ordersTitle')}</h1>
        <Card>
            <CardHeader>
                <CardTitle>{t('allOrders')}</CardTitle>
                <CardDescription>{t('allOrdersDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <p>{t('ordersPlaceholder')}</p>
            </CardContent>
        </Card>
    </div>
  );
}
