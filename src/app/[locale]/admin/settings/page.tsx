import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function AdminSettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminSettings');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('apiKeyCardTitle')}</CardTitle>
          <CardDescription>{t('apiKeyCardDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="gemini-api-key">{t('geminiApiKeyLabel')}</Label>
              <Input
                id="gemini-api-key"
                type="password"
                placeholder={t('geminiApiKeyPlaceholder')}
              />
            </div>
            <Button type="submit">{t('saveButton')}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
