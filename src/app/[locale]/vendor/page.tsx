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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ShoppingCart, DollarSign, Package, Bell, Printer, FileText, FileSpreadsheet } from 'lucide-react';
import { Link } from '@/navigation';
import { getStaffMembers } from '@/lib/staff';
import { RevenueChart } from '@/components/RevenueChart';

export default async function VendorDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('VendorDashboard.main');
  const staffMembers = await getStaffMembers();
  const packers = staffMembers.filter(s => s.role === 'packer');

  const stats = [
    { title: t('stats.todaysRevenue'), value: '฿12,500', icon: DollarSign },
    { title: t('stats.newOrders'), value: '15', icon: ShoppingCart },
    { title: t('stats.activeProducts'), value: '25', icon: Package },
  ];

  const recentOrders = [
    { id: 'ORD-001', customer: 'ร้านอาหารเจริญสุข', amount: '฿2,500.00', status: 'new', assignedTo: null },
    { id: 'ORD-002', customer: 'ครัวคุณหน่อย', amount: '฿1,200.50', status: 'preparing', assignedTo: 'มานะ ใจดี' },
    { id: 'ORD-003', customer: 'โรงแรมแกรนด์พาเลซ', amount: '฿8,750.00', status: 'new', assignedTo: null },
    { id: 'ORD-004', customer: 'ร้านก๋วยเตี๋ยวลุงชัย', amount: '฿850.00', status: 'ready', assignedTo: 'ปิติ ชูใจ' },
    { id: 'ORD-005', customer: 'คาเฟ่ The Nest', amount: '฿1,500.00', status: 'preparing', assignedTo: 'มานะ ใจดี' },
  ];

  const revenueData = {
    today: [
      { time: '08:00', revenue: 1860 }, { time: '09:00', revenue: 3050 }, { time: '10:00', revenue: 2370 },
      { time: '11:00', revenue: 730 }, { time: '12:00', revenue: 2090 }, { time: '13:00', revenue: 2140 },
    ],
    month: [
      { week: 'Week 1', revenue: 78000 }, { week: 'Week 2', revenue: 92000 },
      { week: 'Week 3', revenue: 110000 }, { week: 'Week 4', revenue: 85000 },
    ],
    year: [
      { month: 'Jan', revenue: 650000 }, { month: 'Feb', revenue: 590000 }, { month: 'Mar', revenue: 800000 },
      { month: 'Apr', revenue: 810000 }, { month: 'May', revenue: 560000 }, { month: 'Jun', revenue: 550000 },
      { month: 'Jul', revenue: 400000 }, { month: 'Aug', revenue: 450000 }, { month: 'Sep', revenue: 520000 },
      { month: 'Oct', revenue: 730000 }, { month: 'Nov', revenue: 820000 }, { month: 'Dec', revenue: 950000 },
    ],
  };

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between space-y-2">
            <h1 className="font-headline text-3xl font-bold">{t('title')}</h1>
            <div className="flex items-center space-x-2">
                <Button>
                    <Package className="mr-2 h-4 w-4" />
                    {t('addNewProduct')}
                </Button>
            </div>
        </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>{t('revenueOverview.title')}</CardTitle>
                    <CardDescription>{t('revenueOverview.description')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm"><Printer className="mr-2 h-4 w-4" />{t('revenueOverview.print')}</Button>
                    <Button variant="outline" size="sm"><FileSpreadsheet className="mr-2 h-4 w-4" />{t('revenueOverview.exportExcel')}</Button>
                    <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" />{t('revenueOverview.exportPdf')}</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="month" className="w-full">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
                    <TabsTrigger value="today">{t('revenueOverview.today')}</TabsTrigger>
                    <TabsTrigger value="month">{t('revenueOverview.thisMonth')}</TabsTrigger>
                    <TabsTrigger value="year">{t('revenueOverview.thisYear')}</TabsTrigger>
                </TabsList>
                <TabsContent value="today">
                    <RevenueChart data={revenueData.today} dataKey="time" />
                </TabsContent>
                <TabsContent value="month">
                    <RevenueChart data={revenueData.month} dataKey="week" />
                </TabsContent>
                <TabsContent value="year">
                    <RevenueChart data={revenueData.year} dataKey="month" />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-accent" />
                    {t('recentOrdersTitle')}
                </CardTitle>
                <CardDescription>{t('recentOrdersDescription')}</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/vendor/orders">
                {t('viewAllButton')}
                <ArrowUpRight className="h-4 w-4" />
                </Link>
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaders.orderId')}</TableHead>
                <TableHead>{t('tableHeaders.customer')}</TableHead>
                <TableHead className="text-right">{t('tableHeaders.amount')}</TableHead>
                <TableHead className="text-center">{t('tableHeaders.status')}</TableHead>
                <TableHead>{t('tableHeaders.assignee')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell className="text-right">{order.amount}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={order.status === 'new' ? 'default' : 'secondary'} className={order.status === 'new' ? "bg-accent text-accent-foreground animate-pulse" : ""}>
                      {t(`orderStatus.${order.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={order.assignedTo || 'unassigned'}>
                        <SelectTrigger className="w-full min-w-[150px]">
                            <SelectValue placeholder={t('unassigned')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
                            {packers.map(packer => (
                                <SelectItem key={packer.id} value={packer.name}>
                                    {packer.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
