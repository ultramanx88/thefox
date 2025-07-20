'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { deleteServiceAreaAction } from '@/lib/actions';
import { type ServiceArea } from '@/lib/serviceAreas';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

function SubmitButton() {
  const t = useTranslations('AdminServiceAreas.deleteDialog');
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {t('confirmButton')}
    </Button>
  );
}

export function DeleteAreaDialog({
  isOpen,
  onOpenChange,
  area,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  area: ServiceArea;
}) {
  const t = useTranslations('AdminServiceAreas');
  const { toast } = useToast();
  const [state, formAction] = useFormState(deleteServiceAreaAction, {
    error: undefined,
    success: undefined,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({
        title: t('toast.deleteSuccess'),
      });
      onOpenChange(false);
    } else if (state.error) {
      toast({
        title: t('toast.error'),
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, toast, onOpenChange, t]);

  // Reset form state when dialog is closed/reopened
  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.rich('deleteDialog.description', {
              areaName: area.name,
              b: (chunks) => <strong>{chunks}</strong>,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('dialog.cancelButton')}</AlertDialogCancel>
          <form action={formAction} ref={formRef}>
            <input type="hidden" name="id" value={area.id} />
            <SubmitButton />
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
