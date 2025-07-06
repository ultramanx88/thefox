import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getOrders } from '@/lib/orders';
import { Printer, FileText, FileSpreadsheet } from 'lucide-react';

export default async function CustomerOrdersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('CustomerDashboard');
  const orders = await getOrders();

  const formatCurrency = (amount: number) => `฿${amount.toFixed(2)}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <Accordion type="single" collapsible className="w-full">
            {orders.map((order) => (
              <AccordionItem value={order.id} key={order.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex w-full items-center justify-between gap-4 pr-4 text-sm">
                    <div className="flex flex-col items-start text-left sm:flex-row sm:items-center sm:gap-4">
                      <span className="font-semibold">
                        {t('orderId')}: {order.id}
                      </span>
                      <span className="hidden text-muted-foreground sm:block">
                        {t('orderDate')}: {order.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                       <Badge variant={order.status === 'Delivered' ? 'secondary' : 'default'} className={order.status !== 'Delivered' ? 'bg-accent' : ''}>
                        {t(`status${order.status}` as any)}
                      </Badge>
                      <span className="font-bold text-primary">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">{t('items')}</h3>
                    <div className="rounded-md border">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>{t('product')}</TableHead>
                            <TableHead className="text-center">{t('quantity')}</TableHead>
                            <TableHead className="text-right">{t('price')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">
                                {formatCurrency(item.price)}
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <h3 className="mb-2 text-lg font-semibold">{t('costSummary')}</h3>
                        <div className="space-y-2 rounded-md border p-4">
                            <div className="flex justify-between">
                                <span>{t('subtotal')}</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span>{t('deliveryFee')}</span>
                                <span>{formatCurrency(order.deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('serviceFee')}</span>
                                <span>{formatCurrency(order.serviceFee)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                                <span>{t('grandTotal')}</span>
                                <span>{formatCurrency(order.total)}</span>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col justify-between'>
                        <div/>
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button variant="outline"><Printer className="mr-2 h-4 w-4" />{t('printButton')}</Button>
                            <Button variant="outline"><FileSpreadsheet className="mr-2 h-4 w-4" />{t('downloadExcelButton')}</Button>
                            <Button variant="outline"><FileText className="mr-2 h-4 w-4" />{t('downloadPdfButton')}</Button>
                        </div>
                    </div>
                  </div>

                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
