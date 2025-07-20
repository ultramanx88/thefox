
'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateInvestorAction } from '@/lib/actions';
import type { getInvestmentData } from '@/lib/investment';
import { Loader2 } from 'lucide-react';

type Investor = Awaited<ReturnType<typeof getInvestmentData>>['investors'][0];

interface InvestorEditDialogProps {
  investor: Investor;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  t: any;
  tBanks: any;
}

function SubmitButton({ t }: { t: any }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {t('saveChangesButton')}
    </Button>
  );
}

export function InvestorEditDialog({
  investor,
  isOpen,
  onOpenChange,
  t,
  tBanks,
}: InvestorEditDialogProps) {
  const { toast } = useToast();
  const [state, formAction] = useFormState(updateInvestorAction, {
    error: undefined,
    success: undefined,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescription'),
      });
      onOpenChange(false);
    } else if (state.error) {
      toast({
        title: t('toastErrorTitle'),
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, toast, onOpenChange, t]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('editDialogTitle')}</DialogTitle>
          <DialogDescription>
            {t.rich('editDialogDescription', { investorName: investor.name })}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="space-y-4 py-4">
          <input type="hidden" name="investorId" value={investor.id} />
          <div className="space-y-2">
            <Label htmlFor="name">{t('investorNameLabel')}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={investor.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_name">{t('bankNameLabel')}</Label>
            <Select name="bank_name" defaultValue={investor.bank_info.bank_name}>
              <SelectTrigger id="bank_name">
                <SelectValue placeholder="Select a bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kbank">{tBanks('kbank')}</SelectItem>
                <SelectItem value="scb">{tBanks('scb')}</SelectItem>
                <SelectItem value="bbl">{tBanks('bbl')}</SelectItem>
                <SelectItem value="krungsri">{tBanks('krungsri')}</SelectItem>
                <SelectItem value="ktb">{tBanks('ktb')}</SelectItem>
                <SelectItem value="ttb">{tBanks('ttb')}</SelectItem>
                <SelectItem value="gsb">{tBanks('gsb')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_name">{t('accountNameLabel')}</Label>
            <Input
              id="account_name"
              name="account_name"
              defaultValue={investor.bank_info.account_name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_number">{t('accountNumberLabel')}</Label>
            <Input
              id="account_number"
              name="account_number"
              defaultValue={investor.bank_info.account_number}
              required
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <SubmitButton t={t} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
