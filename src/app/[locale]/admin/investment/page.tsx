import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getInvestmentData } from '@/lib/investment';
import { Users, BarChart, FileSpreadsheet, FileText, Banknote, Landmark } from 'lucide-react';
import { InvestmentChart } from '@/components/InvestmentChart';
import { Separator } from '@/components/ui/separator';

export default async function AdminInvestmentPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminInvestment');
  const { overview, investors, dailyReports } = await getInvestmentData();
  const formatCurrency = (amount: number) => `฿${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const overviewStats = [
    { title: t('stats.totalInvestment'), value: formatCurrency(overview.totalInvestment), icon: Banknote },
    { title: t('stats.totalRevenue'), value: formatCurrency(overview.totalRevenue), icon: BarChart },
    { title: t('stats.totalInvestors'), value: overview.totalInvestors, icon: Users },
    { title: t('stats.founderEarnings'), value: formatCurrency(overview.totalFounderEarnings), icon: Landmark },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat) => (
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

      <Card>
        <CardHeader>
          <CardTitle>{t('investors.title')}</CardTitle>
          <CardDescription>{t('investors.description')}</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('investors.tableHeaders.name')}</TableHead>
                        <TableHead>{t('investors.tableHeaders.investment')}</TableHead>
                        <TableHead>{t('investors.tableHeaders.earnings')}</TableHead>
                        <TableHead>{t('investors.tableHeaders.roi')}</TableHead>
                        <TableHead>{t('investors.tableHeaders.joinDate')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {investors.map((investor) => (
                        <TableRow key={investor.id}>
                            <TableCell className="font-medium">{investor.name}</TableCell>
                            <TableCell>{formatCurrency(investor.total_investment)}</TableCell>
                            <TableCell>{formatCurrency(investor.total_earnings)}</TableCell>
                            <TableCell>
                                <Badge variant={investor.roi >= 0 ? 'secondary' : 'destructive'}>
                                    {investor.roi.toFixed(2)}%
                                </Badge>
                            </TableCell>
                            <TableCell>{investor.join_date}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle>{t('reports.title')}</CardTitle>
              <CardDescription>{t('reports.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline"><FileSpreadsheet className="mr-2 h-4 w-4" />{t('reports.exportExcel')}</Button>
              <Button variant="outline"><FileText className="mr-2 h-4 w-4" />{t('reports.exportPdf')}</Button>
              <Button>{t('reports.processDaily')}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            {dailyReports.map((report, index) => (
              <div key={report.date}>
                {index > 0 && <Separator className="my-6" />}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="rounded-md border p-3">
                        <div className="text-muted-foreground">{t('reports.reportDate')}</div>
                        <div className="font-bold text-lg">{report.date}</div>
                    </div>
                    <div className="rounded-md border p-3">
                        <div className="text-muted-foreground">{t('reports.dailyRevenue')}</div>
                        <div className="font-bold text-lg">{formatCurrency(report.total_revenue)}</div>
                    </div>
                     <div className="rounded-md border p-3">
                        <div className="text-muted-foreground">{t('reports.investorPool')}</div>
                        <div className="font-bold text-lg text-primary">{formatCurrency(report.revenue_distribution.investor_pool)}</div>
                    </div>
                    <div className="rounded-md border p-3">
                        <div className="text-muted-foreground">{t('reports.founderShare')}</div>
                        <div className="font-bold text-lg text-accent">{formatCurrency(report.revenue_distribution.founder_share)}</div>
                    </div>
                </div>
                 <InvestmentChart data={report.investor_earnings} />
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
