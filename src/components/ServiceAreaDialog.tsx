'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { type ServiceArea } from '@/lib/serviceAreas';
import { addServiceAreaAction, updateServiceAreaAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const t = useTranslations('AdminServiceAreas.dialog');
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEditing ? t('saveButton') : t('createButton')}
    </Button>
  );
}

export function ServiceAreaDialog({
  isOpen,
  onOpenChange,
  area,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  area: ServiceArea | null;
}) {
  const t = useTranslations('AdminServiceAreas');
  const tToast = useTranslations('AdminServiceAreas.toast');
  const { toast } = useToast();
  const isEditing = !!area;
  const action = isEditing ? updateServiceAreaAction : addServiceAreaAction;
  const [state, formAction] = useFormState(action, {
    error: undefined,
    success: undefined,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: isEditing ? tToast('updateSuccess') : tToast('addSuccess'),
      });
      onOpenChange(false);
    } else if (state?.error) {
      toast({
        title: tToast('error'),
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, toast, onOpenChange, isEditing, tToast]);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('dialog.editTitle') : t('dialog.addTitle')}
          </DialogTitle>
          <DialogDescription>{t('dialog.description')}</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="space-y-4 py-4">
          {isEditing && <input type="hidden" name="id" value={area.id} />}
          <div className="space-y-2">
            <Label htmlFor="name">{t('dialog.nameLabel')}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={area?.name || ''}
              placeholder={t('dialog.namePlaceholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">{t('dialog.provinceLabel')}</Label>
            <Input
              id="province"
              name="province"
              defaultValue={area?.province || ''}
              placeholder={t('dialog.provincePlaceholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="districts">{t('dialog.districtsLabel')}</Label>
            <Input
              id="districts"
              name="districts"
              defaultValue={area?.districts.join(', ') || ''}
              placeholder={t('dialog.districtsPlaceholder')}
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="status"
              name="status"
              defaultChecked={area ? area.status === 'active' : true}
            />
            <Label htmlFor="status">{t('dialog.statusLabel')}</Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('dialog.cancelButton')}
            </Button>
            <SubmitButton isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
