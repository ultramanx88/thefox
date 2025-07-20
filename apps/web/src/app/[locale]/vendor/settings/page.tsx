'use client';

import { useTranslations } from 'next-intl';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function VendorSettingsPage() {
  const t = useTranslations('VendorSettings');
  const tBanks = useTranslations('AdminSettings.banks');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <div className="space-y-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{t('payoutAccountCardTitle')}</CardTitle>
            <CardDescription>{t('payoutAccountCardDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4 max-w-lg">
                <div className="space-y-2">
                    <Label htmlFor="bank-name">{t('bankNameLabel')}</Label>
                    <Select>
                        <SelectTrigger id="bank-name">
                            <SelectValue placeholder={t('selectBankPlaceholder')} />
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
                    <Label htmlFor="account-name">{t('accountNameLabel')}</Label>
                    <Input id="account-name" placeholder={t('accountNamePlaceholder')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="account-number">{t('accountNumberLabel')}</Label>
                    <Input id="account-number" placeholder={t('accountNumberPlaceholder')} />
                </div>
                <Button type="submit">{t('saveButton')}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
