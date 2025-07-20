'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition } from 'react';
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { registerVendor } from '@/lib/actions';
import { Store, Loader2 } from "lucide-react";

export default function VendorRegistrationPage() {
    const t = useTranslations('VendorRegistration');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const formSchema = z.object({
        storeName: z.string().min(1, t('validation.storeNameRequired')),
        email: z.string().email(t('validation.invalidEmail')),
        password: z.string().min(8, t('validation.passwordLength')),
    });
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          storeName: "",
          email: "",
          password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
          try {
            const result = await registerVendor(values);
            if (result.success) {
              toast({
                title: t('registrationSuccessTitle'),
                description: result.message,
              });
              form.reset();
            } else {
              toast({
                title: t('registrationFailedTitle'),
                description: result.message,
                variant: 'destructive',
              });
            }
          } catch (error) {
            toast({
                title: t('registrationFailedTitle'),
                description: t('registrationFailedGeneric'),
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
                  <Store className="h-8 w-8" />
              </div>
              <CardTitle className="font-headline text-3xl">{t('title')}</CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                        control={form.control}
                        name="storeName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('storeNameLabel')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('storeNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('emailLabel')}</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder={t('emailPlaceholder')} {...field} />
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
                                <Input type="password" placeholder={t('passwordPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('submitButton')}
                        </Button>
                    </form>
              </Form>
            </CardContent>
          </Card>
        </div>
    );
}
