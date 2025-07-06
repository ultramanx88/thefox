import { CategorySuggestion } from "@/components/CategorySuggestion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

export default async function NewProductPage({params: {locale}}: {params: {locale: string}}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('NewProduct');

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="productName">{t('nameLabel')}</Label>
              <Input id="productName" placeholder={t('namePlaceholder')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('descriptionLabel')}</Label>
              <Textarea id="description" placeholder={t('descriptionPlaceholder')} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="price">{t('priceLabel')}</Label>
                    <Input id="price" type="number" placeholder={t('pricePlaceholder')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="stock">{t('quantityLabel')}</Label>
                    <Input id="stock" type="number" placeholder={t('quantityPlaceholder')} />
                </div>
            </div>

            <div className="space-y-2">
                <Label>{t('allowedVehiclesLabel')}</Label>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="motorcycle" defaultChecked />
                        <Label htmlFor="motorcycle" className="font-normal">{t('motorcycle')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="car" defaultChecked />
                        <Label htmlFor="car" className="font-normal">{t('car')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="truck" />
                        <Label htmlFor="truck" className="font-normal">{t('truck')}</Label>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">{t('allowedVehiclesDescription')}</p>
            </div>

            <CategorySuggestion />

            <Button type="submit" size="lg" className="w-full md:w-auto bg-accent hover:bg-accent/90">
              {t('listProductButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
