'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition, useState } from 'react';
import { useTranslations } from "next-intl";
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { MapPin, Loader2, Plus, X, User, Bell, CreditCard } from "lucide-react";

interface Address {
    id: string;
    label: string;
    street: string;
    district: string;
    province: string;
    postalCode: string;
    isDefault: boolean;
}

export default function CustomerOnboardingPage() {
    const t = useTranslations('CustomerOnboarding');
    const [isPending, startTransition] = useTransition();
    const [currentStep, setCurrentStep] = useState(1);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const { toast } = useToast();
    const router = useRouter();

    const profileSchema = z.object({
        avatar: z.string().optional(),
        bio: z.string().optional(),
        language: z.string().min(1, t('validation.languageRequired')),
        currency: z.string().min(1, t('validation.currencyRequired')),
    });

    const addressSchema = z.object({
        label: z.string().min(1, t('validation.addressLabelRequired')),
        street: z.string().min(1, t('validation.streetRequired')),
        district: z.string().min(1, t('validation.districtRequired')),
        province: z.string().min(1, t('validation.provinceRequired')),
        postalCode: z.string().min(5, t('validation.postalCodeRequired')),
    });

    const preferencesSchema = z.object({
        emailNotifications: z.boolean(),
        pushNotifications: z.boolean(),
        smsNotifications: z.boolean(),
        orderUpdates: z.boolean(),
        promotions: z.boolean(),
        newsletter: z.boolean(),
    });

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            avatar: "",
            bio: "",
            language: "th",
            currency: "THB",
        },
    });

    const addressForm = useForm<z.infer<typeof addressSchema>>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            label: "",
            street: "",
            district: "",
            province: "",
            postalCode: "",
        },
    });

    const preferencesForm = useForm<z.infer<typeof preferencesSchema>>({
        resolver: zodResolver(preferencesSchema),
        defaultValues: {
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            orderUpdates: true,
            promotions: true,
            newsletter: false,
        },
    });

    const addAddress = (values: z.infer<typeof addressSchema>) => {
        const newAddress: Address = {
            id: Date.now().toString(),
            ...values,
            isDefault: addresses.length === 0, // First address is default
        };
        setAddresses([...addresses, newAddress]);
        addressForm.reset();
    };

    const removeAddress = (id: string) => {
        setAddresses(addresses.filter(addr => addr.id !== id));
    };

    const setDefaultAddress = (id: string) => {
        setAddresses(addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === id,
        })));
    };

    const handleCompleteOnboarding = async () => {
        startTransition(async () => {
            try {
                const profileData = profileForm.getValues();
                const preferencesData = preferencesForm.getValues();

                // Combine all onboarding data
                const onboardingData = {
                    profile: profileData,
                    addresses,
                    preferences: preferencesData,
                };

                // TODO: Call API to save onboarding data
                console.log('Onboarding data:', onboardingData);

                toast({
                    title: t('onboardingCompleteTitle'),
                    description: t('onboardingCompleteDescription'),
                });

                // Redirect to dashboard
                router.push('/dashboard');
            } catch (error: any) {
                toast({
                    title: t('onboardingFailedTitle'),
                    description: error.message || t('onboardingFailedGeneric'),
                    variant: 'destructive',
                });
            }
        });
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {t('profileSetupTitle')}
                            </CardTitle>
                            <CardDescription>
                                {t('profileSetupDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...profileForm}>
                                <div className="space-y-4">
                                    <FormField
                                        control={profileForm.control}
                                        name="bio"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('bioLabel')} <span className="text-muted-foreground">({t('optional')})</span></FormLabel>
                                                <FormControl>
                                                    <Textarea 
                                                        placeholder={t('bioPlaceholder')} 
                                                        className="resize-none"
                                                        rows={3}
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={profileForm.control}
                                            name="language"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('languageLabel')}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder={t('selectLanguage')} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="th">ไทย</SelectItem>
                                                            <SelectItem value="en">English</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={profileForm.control}
                                            name="currency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('currencyLabel')}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder={t('selectCurrency')} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="THB">THB (฿)</SelectItem>
                                                            <SelectItem value="USD">USD ($)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </Form>
                        </CardContent>
                    </Card>
                );

            case 2:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                {t('addressSetupTitle')}
                            </CardTitle>
                            <CardDescription>
                                {t('addressSetupDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add Address Form */}
                            <Form {...addressForm}>
                                <form onSubmit={addressForm.handleSubmit(addAddress)} className="space-y-4">
                                    <FormField
                                        control={addressForm.control}
                                        name="label"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('addressLabelLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder={t('addressLabelPlaceholder')} 
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={addressForm.control}
                                        name="street"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('streetLabel')}</FormLabel>
                                                <FormControl>
                                                    <Textarea 
                                                        placeholder={t('streetPlaceholder')} 
                                                        className="resize-none"
                                                        rows={2}
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={addressForm.control}
                                            name="district"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('districtLabel')}</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            placeholder={t('districtPlaceholder')} 
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={addressForm.control}
                                            name="province"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('provinceLabel')}</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            placeholder={t('provincePlaceholder')} 
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={addressForm.control}
                                        name="postalCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('postalCodeLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder={t('postalCodePlaceholder')} 
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" variant="outline" className="w-full">
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('addAddressButton')}
                                    </Button>
                                </form>
                            </Form>

                            {/* Address List */}
                            {addresses.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-medium">{t('savedAddresses')}</h4>
                                    {addresses.map((address) => (
                                        <div key={address.id} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-medium">{address.label}</span>
                                                        {address.isDefault && (
                                                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                                                {t('defaultAddress')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {address.street}<br />
                                                        {address.district}, {address.province} {address.postalCode}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {!address.isDefault && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setDefaultAddress(address.id)}
                                                        >
                                                            {t('setDefault')}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => removeAddress(address.id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );

            case 3:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                {t('preferencesSetupTitle')}
                            </CardTitle>
                            <CardDescription>
                                {t('preferencesSetupDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...preferencesForm}>
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-medium mb-3">{t('notificationChannels')}</h4>
                                        <div className="space-y-3">
                                            <FormField
                                                control={preferencesForm.control}
                                                name="emailNotifications"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">
                                                                {t('emailNotifications')}
                                                            </FormLabel>
                                                            <div className="text-sm text-muted-foreground">
                                                                {t('emailNotificationsDescription')}
                                                            </div>
                                                        </div>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={preferencesForm.control}
                                                name="pushNotifications"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">
                                                                {t('pushNotifications')}
                                                            </FormLabel>
                                                            <div className="text-sm text-muted-foreground">
                                                                {t('pushNotificationsDescription')}
                                                            </div>
                                                        </div>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={preferencesForm.control}
                                                name="smsNotifications"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">
                                                                {t('smsNotifications')}
                                                            </FormLabel>
                                                            <div className="text-sm text-muted-foreground">
                                                                {t('smsNotificationsDescription')}
                                                            </div>
                                                        </div>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-3">{t('notificationTypes')}</h4>
                                        <div className="space-y-3">
                                            <FormField
                                                control={preferencesForm.control}
                                                name="orderUpdates"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">
                                                                {t('orderUpdates')}
                                                            </FormLabel>
                                                            <div className="text-sm text-muted-foreground">
                                                                {t('orderUpdatesDescription')}
                                                            </div>
                                                        </div>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={preferencesForm.control}
                                                name="promotions"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">
                                                                {t('promotions')}
                                                            </FormLabel>
                                                            <div className="text-sm text-muted-foreground">
                                                                {t('promotionsDescription')}
                                                            </div>
                                                        </div>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={preferencesForm.control}
                                                name="newsletter"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">
                                                                {t('newsletter')}
                                                            </FormLabel>
                                                            <div className="text-sm text-muted-foreground">
                                                                {t('newsletterDescription')}
                                                            </div>
                                                        </div>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                ${currentStep >= step 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                }
                            `}>
                                {step}
                            </div>
                            {step < 3 && (
                                <div className={`
                                    w-16 h-1 mx-2
                                    ${currentStep > step ? 'bg-primary' : 'bg-muted'}
                                `} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                    <span>{t('profileStep')}</span>
                    <span>{t('addressStep')}</span>
                    <span>{t('preferencesStep')}</span>
                </div>
            </div>

            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                >
                    {t('previousButton')}
                </Button>

                {currentStep < 3 ? (
                    <Button
                        onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                    >
                        {t('nextButton')}
                    </Button>
                ) : (
                    <Button
                        onClick={handleCompleteOnboarding}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {t('completeOnboardingButton')}
                    </Button>
                )}
            </div>

            {/* Skip Option */}
            <div className="text-center mt-4">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard')}
                    className="text-muted-foreground"
                >
                    {t('skipOnboarding')}
                </Button>
            </div>
        </div>
    );
}