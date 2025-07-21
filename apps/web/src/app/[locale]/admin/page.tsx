import { getTranslations } from 'next-intl/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, ShoppingCart, DollarSign, Package } from 'lucide-react';

export default async function AdminDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations('AdminDashboard.main');

  const stats = [
    { title: t('stats.totalRevenue'), value: '฿1,250,345', icon: DollarSign },
    { title: t('stats.totalOrders'), value: '1,234', icon: ShoppingCart },
    { title: t('stats.totalCustomers'), value: '567', icon: Users },
    { title: t('stats.totalProducts'), value: '89', icon: Package },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold">{t('title')}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* More dashboard components can be added here, like recent orders or charts */}
    </div>
  );
}
