import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpenCheck } from 'lucide-react';

export default async function DriverAcademyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations('DriverAcademy');
  
  const languages = [
    { lang: 'zh', name: t('languages.zh'), description: t('descriptions.zh') },
    { lang: 'ja', name: t('languages.ja'), description: t('descriptions.ja') },
    { lang: 'ko', name: t('languages.ko'), description: t('descriptions.ko') },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {languages.map((language) => (
          <Card key={language.lang}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenCheck className="h-6 w-6 text-accent" />
                {language.name}
              </CardTitle>
              <CardDescription>{language.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{t('passingRequirement')}</p>
              <Button className="w-full">{t('startTestButton')}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
