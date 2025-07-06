
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  calculateFees,
  type CalculateFeesInput,
  type CalculateFeesOutput,
} from '@/ai/flows/calculate-fees-flow';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const defaultFeeConfig = {
  base_delivery_fee: 30,
  delivery_fee_per_km: 10,
  express_surcharge: 25,
  premium_surcharge: 50,
  service_fee_percentage: 3,
  min_service_fee: 15,
  food_commission_rate: 20,
  retail_commission_rate: 12,
  grocery_commission_rate: 15,
};

const defaultOrderInput = {
  order_value: 1000,
  delivery_distance: 5,
  service_type: 'normal' as const,
  store_category: 'food' as const,
};

export default function AdminFeeSimulatorPage() {
  const t = useTranslations('AdminFeeSimulator');
  const [isPending, startTransition] = useTransition();

  const [feeConfig, setFeeConfig] = useState(defaultFeeConfig);
  const [orderInput, setOrderInput] = useState(defaultOrderInput);
  const [results, setResults] = useState<CalculateFeesOutput | null>(null);

  useEffect(() => {
    const simulationInput: CalculateFeesInput = {
      ...orderInput,
      config: feeConfig,
    };
    startTransition(async () => {
      const res = await calculateFees(simulationInput);
      setResults(res);
    });
  }, [feeConfig, orderInput]);

  const handleConfigChange = (key: keyof typeof feeConfig, value: number) => {
    setFeeConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleOrderChange = (
    key: keyof typeof orderInput,
    value: string | number
  ) => {
    setOrderInput((prev) => ({ ...prev, [key]: value }));
  };
  
  const formatCurrency = (amount: number) => `฿${amount.toFixed(2)}`;

  const ResultRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center py-2 border-b last:border-b-0">
        <span className="text-muted-foreground">{label}</span>
        {isPending ? <Skeleton className="h-5 w-24" /> : <span className="font-semibold">{value}</span>}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('configCardTitle')}</CardTitle>
              <CardDescription>{t('configCardDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>{t('baseDeliveryFeeLabel')}: {formatCurrency(feeConfig.base_delivery_fee)}</Label>
                    <Slider value={[feeConfig.base_delivery_fee]} onValueChange={([v]) => handleConfigChange('base_delivery_fee', v)} max={100} step={1} />
                </div>
                <div className="space-y-2">
                    <Label>{t('feePerKmLabel')}: {formatCurrency(feeConfig.delivery_fee_per_km)}</Label>
                    <Slider value={[feeConfig.delivery_fee_per_km]} onValueChange={([v]) => handleConfigChange('delivery_fee_per_km', v)} max={20} step={0.5} />
                </div>
                 <div className="space-y-2">
                    <Label>{t('serviceFeePercentageLabel')}: {feeConfig.service_fee_percentage}%</Label>
                    <Slider value={[feeConfig.service_fee_percentage]} onValueChange={([v]) => handleConfigChange('service_fee_percentage', v)} max={10} step={0.1} />
                </div>
                 <div className="space-y-2">
                    <Label>{t('minServiceFeeLabel')}: {formatCurrency(feeConfig.min_service_fee)}</Label>
                    <Slider value={[feeConfig.min_service_fee]} onValueChange={([v]) => handleConfigChange('min_service_fee', v)} max={50} step={1} />
                </div>
                <Separator/>
                <h4 className="font-medium text-sm">{t('commissionRatesTitle')}</h4>
                <div className="space-y-2">
                    <Label>{t('foodCommissionLabel')}: {feeConfig.food_commission_rate}%</Label>
                    <Slider value={[feeConfig.food_commission_rate]} onValueChange={([v]) => handleConfigChange('food_commission_rate', v)} max={30} step={0.5} />
                </div>
                <div className="space-y-2">
                    <Label>{t('retailCommissionLabel')}: {feeConfig.retail_commission_rate}%</Label>
                    <Slider value={[feeConfig.retail_commission_rate]} onValueChange={([v]) => handleConfigChange('retail_commission_rate', v)} max={30} step={0.5} />
                </div>
                <div className="space-y-2">
                    <Label>{t('groceryCommissionLabel')}: {feeConfig.grocery_commission_rate}%</Label>
                    <Slider value={[feeConfig.grocery_commission_rate]} onValueChange={([v]) => handleConfigChange('grocery_commission_rate', v)} max={30} step={0.5} />
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t('simulationCardTitle')}</CardTitle>
                    <CardDescription>{t('simulationCardDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="orderValue">{t('orderValueLabel')}</Label>
                        <Input id="orderValue" type="number" value={orderInput.order_value} onChange={(e) => handleOrderChange('order_value', e.target.valueAsNumber)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="deliveryDistance">{t('distanceLabel')}</Label>
                        <Input id="deliveryDistance" type="number" value={orderInput.delivery_distance} onChange={(e) => handleOrderChange('delivery_distance', e.target.valueAsNumber)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="serviceType">{t('serviceTypeLabel')}</Label>
                        <Select value={orderInput.service_type} onValueChange={(v) => handleOrderChange('service_type', v)}>
                            <SelectTrigger id="serviceType"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="normal">{t('normal')}</SelectItem>
                                <SelectItem value="express">{t('express')}</SelectItem>
                                <SelectItem value="premium">{t('premium')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="storeCategory">{t('storeCategoryLabel')}</Label>
                        <Select value={orderInput.store_category} onValueChange={(v) => handleOrderChange('store_category', v)}>
                            <SelectTrigger id="storeCategory"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="food">{t('food')}</SelectItem>
                                <SelectItem value="retail">{t('retail')}</SelectItem>
                                <SelectItem value="grocery">{t('grocery')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {t('resultsCardTitle')}
                      {isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription>{t('resultsCardDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <ResultRow label={t('results.customerTotal')} value={results ? formatCurrency(results.customer_total) : '...'} />
                        <Separator/>
                        <ResultRow label={t('results.deliveryFee')} value={results ? formatCurrency(results.delivery_fee) : '...'} />
                        <ResultRow label={t('results.serviceFee')} value={results ? formatCurrency(results.service_fee) : '...'} />
                        <ResultRow label={t('results.commission')} value={results ? formatCurrency(results.commission) : '...'} />
                        <Separator/>
                        <ResultRow label={t('results.storeEarning')} value={results ? formatCurrency(results.store_earning) : '...'} />
                        <ResultRow label={t('results.driverEarning')} value={results ? formatCurrency(results.driver_earning) : '...'} />
                         <Separator/>
                        <ResultRow label={t('results.platformRevenue')} value={results ? formatCurrency(results.platform_revenue) : '...'} />
                        <ResultRow label={t('results.platformProfitPercentage')} value={results ? `${results.platform_profit_percentage.toFixed(2)}%` : '...'} />
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
