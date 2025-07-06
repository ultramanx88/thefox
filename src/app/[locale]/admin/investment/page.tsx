
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
import { Users, BarChart, FileSpreadsheet, FileText, Banknote, Landmark, Pencil } from 'lucide-react';
import { InvestmentChart } from '@/components/InvestmentChart';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { InvestorEditDialog } from '@/components/InvestorEditDialog';

type InvestmentData = Awaited<ReturnType<typeof getInvestmentData>>;
type Investor = InvestmentData['investors'][0];

export default function AdminInvestmentPage() {
  const t = useTranslations('AdminInvestment');
  const tBanks = useTranslations('AdminSettings.banks');
  const [data, setData] = useState<InvestmentData | null>(null);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);

  useEffect(() => {
    getInvestmentData().then(setData);
  }, []);
  
  const formatCurrency = (amount: number) => `฿${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const overviewStats = data ? [
    { title: t('stats.totalInvestment'), value: formatCurrency(data.overview.totalInvestment), icon: Banknote },
    { title: t('stats.totalRevenue'), value: formatCurrency(data.overview.totalRevenue), icon: BarChart },
    { title: t('stats.totalInvestors'), value: data.overview.totalInvestors, icon: Users },
    { title: t('stats.founderEarnings'), value: formatCurrency(data.overview.totalFounderEarnings), icon: Landmark },
  ] : Array(4).fill(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat, index) => (
          <Card key={stat?.title || index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat ? stat.title : <Skeleton className="h-5 w-32" />}
              </CardTitle>
              {stat && <stat.icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                 {stat ? stat.value : <Skeleton className="h-8 w-40" />}
              </div>
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
                        <TableHead className="text-right">{t('investors.tableHeaders.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data ? data.investors.map((investor) => (
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
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => setEditingInvestor(investor)}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">{t('investors.editAction')}</span>
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : Array(3).fill(null).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                            <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                            <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                            <TableCell><Skeleton className="h-6 w-16"/></TableCell>
                            <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block"/></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      {editingInvestor && (
        <InvestorEditDialog
          investor={editingInvestor}
          isOpen={!!editingInvestor}
          onOpenChange={(open) => {
            if (!open) {
              setEditingInvestor(null);
            }
          }}
          t={t.rich('investors', { investorName: editingInvestor.name })}
          tBanks={tBanks}
        />
      )}

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
            {data ? data.dailyReports.map((report, index) => {
              const chartData = Object.entries(report.investor_earnings).map(([investorId, earnings]) => {
                const investor = data.investors.find(inv => inv.id === investorId);
                return { investorName: investor ? investor.name : 'Unknown', earnings };
              });

              return (
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
                        <div className="font-bold text-lg text-primary">{formatCurrency(report.distributions.investor_pool)}</div>
                    </div>
                    <div className="rounded-md border p-3">
                        <div className="text-muted-foreground">{t('reports.founderShare')}</div>
                        <div className="font-bold text-lg text-accent">{formatCurrency(report.distributions.founder_share)}</div>
                    </div>
                </div>
                 <InvestmentChart data={chartData} />
              </div>
            )}) : <Skeleton className="h-64 w-full"/>}
        </CardContent>
      </Card>
    </div>
  );
}
