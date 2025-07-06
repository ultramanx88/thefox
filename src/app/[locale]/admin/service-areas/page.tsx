'use client';

import { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { getServiceAreas, type ServiceArea } from '@/lib/serviceAreas';
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
import { PlusCircle, Pencil, Trash2, Loader2, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ServiceAreaDialog } from '@/components/ServiceAreaDialog';
import { DeleteAreaDialog } from '@/components/DeleteAreaDialog';

export default function ServiceAreasPage() {
  const t = useTranslations('AdminServiceAreas');
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<ServiceArea | null>(null);

  const [_, startTransition] = useTransition();

  const refetchAreas = () => {
    setIsLoading(true);
    startTransition(() => {
        getServiceAreas().then((data) => {
            setAreas(data);
            setIsLoading(false);
        });
    });
  }

  useEffect(() => {
    refetchAreas();
  }, []);

  const handleOpenDialog = (area: ServiceArea | null) => {
    setSelectedArea(area);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (area: ServiceArea) => {
    setSelectedArea(area);
    setIsDeleteDialogOpen(true);
  };
  
  const onDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
        setSelectedArea(null);
        refetchAreas();
    }
  }

  const onDeleteDialogClose = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
        setSelectedArea(null);
        refetchAreas();
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={() => handleOpenDialog(null)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addButton')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('tableTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaders.name')}</TableHead>
                <TableHead>{t('tableHeaders.province')}</TableHead>
                <TableHead>{t('tableHeaders.districts')}</TableHead>
                <TableHead>{t('tableHeaders.status')}</TableHead>
                <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 inline-block" /></TableCell>
                    </TableRow>
                ))
              ) : areas.length > 0 ? (
                areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{area.province}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {area.districts.map(d => <Badge variant="secondary" key={d}>{d}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={area.status === 'active' ? 'default' : 'outline'}>
                        {t(`status.${area.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(area)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">{t('editAction')}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleOpenDeleteDialog(area)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t('deleteAction')}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {t('noAreas')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ServiceAreaDialog 
        isOpen={isDialogOpen}
        onOpenChange={onDialogClose}
        area={selectedArea}
      />

      {selectedArea && (
        <DeleteAreaDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={onDeleteDialogClose}
            area={selectedArea}
        />
      )}
    </div>
  );
}
