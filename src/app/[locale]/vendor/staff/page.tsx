import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getStaffMembers } from '@/lib/staff';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default async function VendorStaffPage({ params: { locale } }: { params: { locale: string }}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('VendorStaff');
  const staffMembers = await getStaffMembers();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addStaffButton')}
        </Button>
      </div>
        
      <Card>
        <CardHeader>
            <CardTitle>{t('currentStaffTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('tableHeaders.name')}</TableHead>
                        <TableHead>{t('tableHeaders.role')}</TableHead>
                        <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {staffMembers.map((staff) => (
                        <TableRow key={staff.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="person avatar" />
                                        <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{staff.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={staff.role === 'manager' ? 'default' : 'secondary'}>
                                    {t(`roles.${staff.role}`)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">{t('editAction')}</span>
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">{t('removeAction')}</span>
                                </Button>
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
