'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { addCategoryAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('CategoryAdmin');
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {t('addCategoryButton')}
    </Button>
  );
}

export function CategoryAdmin() {
  const t = useTranslations('CategoryAdmin');
  const [state, formAction] = useFormState(addCategoryAction, { error: undefined, success: undefined });
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescription'),
      });
      formRef.current?.reset();
    } else if (state?.error) {
      toast({
        title: t('toastErrorTitle'),
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, toast, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('addNewCategoryTitle')}</CardTitle>
        <CardDescription>{t('addNewCategoryDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} ref={formRef} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">{t('categoryNameLabel')}</Label>
            <Input
              id="categoryName"
              name="categoryName"
              placeholder={t('categoryNamePlaceholder')}
              required
            />
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
