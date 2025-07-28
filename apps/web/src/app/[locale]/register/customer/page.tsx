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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { registerCustomer } from '@/lib/actions';
import { User, Loader2, Mail, Phone, Calendar, Lock } from "lucide-react";

export default function CustomerRegistrationPage() {
    const t = useTranslations('CustomerRegistration');
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const formSchema = z.object({
        firstName: z.string().min(1, t('validation.firstNameRequired')),
        lastName: z.string().min(1, t('validation.lastNameRequired')),
        email: z.string().email(t('validation.invalidEmail')),
        phone: z.string().min(10, t('validation.phoneRequired')),
        password: z.string().min(8, t('validation.passwordLength')),
        confirmPassword: z.string().min(8, t('validation.confirmPasswordRequired')),
        dateOfBirth: z.string().optional(),
        acceptTerms: z.boolean().refine(val => val === true, {
            message: t('validation.acceptTermsRequired'),
        }),
    }).refine((data) => data.password === data.confirmPassword, {
        message: t('validation.passwordMismatch'),
        path: ["confirmPassword"],
    });
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
            dateOfBirth: "",
            acceptTerms: false,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            try {
                const result = await registerCustomer(values);
                if (result.success) {
                    toast({
                        title: t('registrationSuccessTitle'),
                        description: result.message,
                    });
                    form.reset();
                    
                    // Redirect to verification page or dashboard
                    router.push('/account/verify-email');
                } else {
                    toast({
                        title: t('registrationFailedTitle'),
                        description: result.message,
                        variant: 'destructive',
                    });
                }
            } catch (error: any) {
                toast({
                    title: t('registrationFailedTitle'),
                    description: error.message || t('registrationFailedGeneric'),
                    variant: 'destructive',
                });
            }
        });
    }

    return (
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
                        <User className="h-8 w-8" />
                    </div>
                    <CardTitle className="font-headline text-3xl">{t('title')}</CardTitle>
                    <CardDescription>
                        {t('description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('firstNameLabel')}</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        placeholder={t('firstNamePlaceholder')} 
                                                        className="pl-10"
                                                        {...field} 
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('lastNameLabel')}</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        placeholder={t('lastNamePlaceholder')} 
                                                        className="pl-10"
                                                        {...field} 
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('emailLabel')}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="email" 
                                                    placeholder={t('emailPlaceholder')} 
                                                    className="pl-10"
                                                    {...field} 
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('phoneLabel')}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="tel" 
                                                    placeholder={t('phonePlaceholder')} 
                                                    className="pl-10"
                                                    {...field} 
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dateOfBirth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('dateOfBirthLabel')} <span className="text-muted-foreground">({t('optional')})</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="date" 
                                                    className="pl-10"
                                                    {...field} 
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('passwordLabel')}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder={t('passwordPlaceholder')} 
                                                    className="pl-10"
                                                    {...field} 
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder={t('confirmPasswordPlaceholder')} 
                                                    className="pl-10"
                                                    {...field} 
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="showPassword"
                                    checked={showPassword}
                                    onCheckedChange={setShowPassword}
                                />
                                <label 
                                    htmlFor="showPassword" 
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {t('showPassword')}
                                </label>
                            </div>

                            <FormField
                                control={form.control}
                                name="acceptTerms"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-sm">
                                                {t('acceptTermsLabel')} <a href="/terms" className="text-primary hover:underline">{t('termsLink')}</a> {t('and')} <a href="/privacy" className="text-primary hover:underline">{t('privacyLink')}</a>
                                            </FormLabel>
                                            <FormMessage />
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {t('submitButton')}
                            </Button>

                            <div className="text-center text-sm text-muted-foreground">
                                {t('alreadyHaveAccount')} <a href="/login" className="text-primary hover:underline">{t('signInLink')}</a>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}