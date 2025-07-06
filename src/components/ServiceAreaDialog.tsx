'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

type AreaType = 'administrative' | 'radius';

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
  const [areaType, setAreaType] = useState<AreaType>(area?.type || 'administrative');
  
  useEffect(() => {
    if (area) {
      setAreaType(area.type);
    } else {
      setAreaType('administrative');
    }
  }, [area]);

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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      formRef.current?.reset();
      // Reset form state if needed
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('dialog.editTitle') : t('dialog.addTitle')}
          </DialogTitle>
          <DialogDescription>{t('dialog.description')}</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="space-y-4 py-4">
          {isEditing && <input type="hidden" name="id" value={area.id} />}
          <input type="hidden" name="type" value={areaType} />

          <div className="space-y-2">
            <Label htmlFor="name">{t('dialog.nameLabel')}</Label>
            <Input id="name" name="name" defaultValue={area?.name || ''} placeholder={t('dialog.namePlaceholder')} required />
          </div>

          <div className="space-y-3">
             <Label>{t('dialog.typeLabel')}</Label>
             <RadioGroup value={areaType} onValueChange={(v: string) => setAreaType(v as AreaType)} className="grid grid-cols-2 gap-4">
                <div>
                    <RadioGroupItem value="administrative" id="administrative" className="peer sr-only" />
                    <Label htmlFor="administrative" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        {t('areaType.administrative')}
                    </Label>
                </div>
                 <div>
                    <RadioGroupItem value="radius" id="radius" className="peer sr-only" />
                    <Label htmlFor="radius" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        {t('areaType.radius')}
                    </Label>
                </div>
             </RadioGroup>
          </div>

          {areaType === 'administrative' && (
            <div className="space-y-4 rounded-md border p-4">
              <div className="space-y-2">
                <Label htmlFor="province">{t('dialog.provinceLabel')}</Label>
                <Input id="province" name="province" defaultValue={area?.type === 'administrative' ? area.province : ''} placeholder={t('dialog.provincePlaceholder')} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="districts">{t('dialog.districtsLabel')}</Label>
                <Input id="districts" name="districts" defaultValue={area?.type === 'administrative' ? area.districts.join(', ') : ''} placeholder={t('dialog.districtsPlaceholder')} required />
              </div>
            </div>
          )}

          {areaType === 'radius' && (
            <div className="space-y-4 rounded-md border p-4">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="lat">{t('dialog.latLabel')}</Label>
                    <Input id="lat" name="lat" type="number" step="any" defaultValue={area?.type === 'radius' ? area.lat : ''} placeholder="13.7563" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng">{t('dialog.lngLabel')}</Label>
                    <Input id="lng" name="lng" type="number" step="any" defaultValue={area?.type === 'radius' ? area.lng : ''} placeholder="100.5018" required />
                  </div>
               </div>
                <div className="space-y-2">
                    <Label htmlFor="radius">{t('dialog.radiusLabel')}</Label>
                    <Input id="radius" name="radius" type="number" step="any" defaultValue={area?.type === 'radius' ? area.radius : ''} placeholder="10" required />
                </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch id="status" name="status" defaultChecked={area ? area.status === 'active' : true} />
            <Label htmlFor="status">{t('dialog.statusLabel')}</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('dialog.cancelButton')}
            </Button>
            <SubmitButton isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
