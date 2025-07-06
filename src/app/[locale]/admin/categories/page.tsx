import { getCategories } from '@/lib/categories';
import {
  Card,
  CardContent,
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
import { CategoryAdmin } from '@/components/CategoryAdmin';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

export default async function AdminCategoriesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('CategoryAdmin');
  const categories = await getCategories();

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold">{t('pageTitle')}</h1>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <CategoryAdmin />
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('existingCategoriesTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>{t('nameHeader')}</TableHead>
                    <TableHead>{t('slugHeader')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-mono text-xs">
                        {category.id}
                      </TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.slug}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
