
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Clock, DollarSign, MapPin, Info } from 'lucide-react';
import { getAvailableJobs, getScheduledJobs } from '@/lib/jobs';
import { Link } from '@/navigation';
import { CancelJobButton } from '@/components/CancelJobButton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function DriverJobsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('DriverJobs');
  const availableJobs = await getAvailableJobs();
  const scheduledJobs = await getScheduledJobs();
  
  const formatCurrency = (amount: number) => `฿${amount.toFixed(2)}`;

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'In Progress': return { variant: 'default' as const, className: 'bg-accent text-accent-foreground' };
        case 'Accepted': return { variant: 'default' as const, className: '' };
        default: return { variant: 'secondary' as const, className: '' };
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
          <TabsTrigger value="available">{t('availableJobs')}</TabsTrigger>
          <TabsTrigger value="mySchedule">{t('mySchedule')}</TabsTrigger>
        </TabsList>
        <TabsContent value="available" className="mt-6 space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{t('dispatchRules.title')}</AlertTitle>
            <AlertDescription>
              {t('dispatchRules.description')}
            </AlertDescription>
          </Alert>
          <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>{t('tableHeaders.route')}</TableHead>
                            <TableHead>{t('tableHeaders.distance')}</TableHead>
                            <TableHead>{t('tableHeaders.payout')}</TableHead>
                            <TableHead>{t('tableHeaders.timeWindow')}</TableHead>
                            <TableHead className="text-right">{t('tableHeaders.action')}</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {availableJobs.length > 0 ? availableJobs.map((job) => (
                            <TableRow key={job.id}>
                                <TableCell>
                                    <div className="font-medium">{job.orderId}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                        <span>{job.pickup}</span>
                                        <ArrowRight className="h-3 w-3" />
                                        <span>{job.delivery}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{job.distance.toFixed(1)} km</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 font-semibold text-primary">
                                        <DollarSign className="h-4 w-4" />
                                        {formatCurrency(job.payout)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{job.date}</span>
                                        </div>
                                         <div className="flex items-center gap-2 mt-1">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>{job.timeWindow}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button>{t('acceptJob')}</Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    {t('noAvailableJobs')}
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="mySchedule" className="mt-6">
           <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>{t('tableHeaders.time')}</TableHead>
                        <TableHead>{t('tableHeaders.orderId')}</TableHead>
                        <TableHead>{t('tableHeaders.status')}</TableHead>
                        <TableHead className="text-right">{t('tableHeaders.action')}</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                     {scheduledJobs.map((job) => {
                        const { variant, className } = getStatusVariant(job.status);
                        return (
                        <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.time}</TableCell>
                            <TableCell>{job.orderId}</TableCell>
                            <TableCell>
                                <Badge variant={variant} className={className}>
                                    {t(`status${job.status.replace(' ','')}` as any)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {job.status === 'Accepted' && job.acceptedAt ? (
                                    <CancelJobButton acceptedAt={job.acceptedAt} />
                                ) : (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/delivery/${job.orderId.replace('ORD-','')}`}>
                                        {t('viewDetails')}
                                    </Link>
                                </Button>
                                )}
                            </TableCell>
                        </TableRow>
                     )})}
                     {scheduledJobs.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                {t('noScheduledJobs')}
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
