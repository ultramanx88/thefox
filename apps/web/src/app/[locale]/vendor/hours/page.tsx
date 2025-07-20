import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRegularHours, getSpecialHours } from '@/lib/hours';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Pencil, PlusCircle } from 'lucide-react';

export default async function VendorHoursPage({ params: { locale } }: { params: { locale: string }}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('VendorHours');
  const tDays = await getTranslations('Days');

  const regularHours = await getRegularHours();
  const specialHours = await getSpecialHours();

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-8">
        <h1 className="font-headline text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
        
        <div className="grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>{t('regularHoursTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {dayOrder.map(dayKey => {
                        const dayInfo = regularHours.find(d => d.day.toLowerCase() === dayKey);
                        return (
                            <div key={dayKey} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                                <span className="font-medium">{tDays(dayKey)}</span>
                                {dayInfo?.isOpen ? (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{dayInfo.open} - {dayInfo.close}</Badge>
                                    </div>
                                ) : (
                                    <Badge variant="outline">{t('statusClosed')}</Badge>
                                )}
                            </div>
                        )
                    })}
                </CardContent>
                <CardFooter>
                    <Button variant="outline">
                        <Pencil className="mr-2 h-4 w-4" />
                        {t('editButton')}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('specialHoursTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {specialHours.length > 0 ? specialHours.map(item => (
                        <div key={item.id} className="flex justify-between items-start pb-2 border-b last:border-b-0">
                            <div>
                                <p className="font-medium">{item.date}</p>
                                <p className="text-sm text-muted-foreground">{item.reason}</p>
                            </div>
                            {item.isClosed ? (
                                <Badge variant="destructive">{t('statusClosed')}</Badge>
                            ) : (
                                <Badge>{item.open} - {item.close}</Badge>
                            )}
                        </div>
                     )) : <p className="text-muted-foreground text-sm">{t('noSpecialHours')}</p>}
                </CardContent>
                <CardFooter>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('addSpecialHoursButton')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
