'use client';

import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function AdminSettingsPage() {
  const t = useTranslations('AdminSettings');
  const [provider, setProvider] = useState('stripe');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <div className="space-y-8 max-w-4xl">
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
                  placeholder="******************"
                />
              </div>
              <Button type="submit">{t('saveButton')}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('firebaseCardTitle')}</CardTitle>
            <CardDescription>{t('firebaseCardDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="firebase-service-account">{t('serviceAccountJsonLabel')}</Label>
                <Textarea
                  id="firebase-service-account"
                  placeholder={t('serviceAccountJsonPlaceholder')}
                  rows={8}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="firebase-web-api-key">{t('webApiKeyLabel')}</Label>
                <Input
                  id="firebase-web-api-key"
                  placeholder={t('webApiKeyPlaceholder')}
                />
                 <p className="text-xs text-muted-foreground">{t('webApiKeyDescription')}</p>
              </div>
              <Button type="submit">{t('saveFirebaseButton')}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('paymentGatewayCardTitle')}</CardTitle>
            <CardDescription>
              {t('paymentGatewayCardDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label>{t('selectProviderLabel')}</Label>
                <RadioGroup
                  value={provider}
                  onValueChange={setProvider}
                  className="flex flex-col sm:flex-row gap-4 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stripe" id="stripe" />
                    <Label htmlFor="stripe">{t('stripe')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="omise" id="omise" />
                    <Label htmlFor="omise">{t('omise')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="qrcode" id="qrcode" />
                    <Label htmlFor="qrcode">{t('qrCode')}</Label>
                  </div>
                </RadioGroup>
              </div>

              {provider === 'stripe' && (
                <div className="space-y-4 rounded-md border p-4">
                   <h3 className="font-medium">{t('stripeKeysLabel')}</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="stripe-pk">{t('publishableKeyLabel')}</Label>
                        <Input id="stripe-pk" placeholder={t('publishableKeyPlaceholder')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stripe-sk">{t('secretKeyLabel')}</Label>
                        <Input id="stripe-sk" type="password" placeholder={t('secretKeyPlaceholder')} />
                    </div>
                   </div>
                </div>
              )}

              {provider === 'omise' && (
                 <div className="space-y-4 rounded-md border p-4">
                   <h3 className="font-medium">{t('omiseKeysLabel')}</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="omise-pk">{t('publishableKeyLabel')}</Label>
                        <Input id="omise-pk" placeholder={t('publishableKeyPlaceholder')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="omise-sk">{t('secretKeyLabel')}</Label>
                        <Input id="omise-sk" type="password" placeholder={t('secretKeyPlaceholder')} />
                    </div>
                   </div>
                </div>
              )}

              {provider === 'qrcode' && (
                <div className="rounded-md border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">{t('qrCodeInstructions')}</p>
                </div>
              )}
              
              <Button type="submit">{t('saveButton')}</Button>
            </form>
          </CardContent>
        </Card>

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
                            <SelectItem value="kbank">{t('banks.kbank')}</SelectItem>
                            <SelectItem value="scb">{t('banks.scb')}</SelectItem>
                            <SelectItem value="bbl">{t('banks.bbl')}</SelectItem>
                            <SelectItem value="krungsri">{t('banks.krungsri')}</SelectItem>
                            <SelectItem value="ktb">{t('banks.ktb')}</SelectItem>
                            <SelectItem value="ttb">{t('banks.ttb')}</SelectItem>
                            <SelectItem value="gsb">{t('banks.gsb')}</SelectItem>
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
