'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
    const t = useTranslations('EmailVerification');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [message, setMessage] = useState('');

    // Check if there's an action code in the URL (from email link)
    const actionCode = searchParams.get('oobCode');
    const mode = searchParams.get('mode');

    useEffect(() => {
        if (actionCode && mode === 'verifyEmail') {
            handleEmailVerification(actionCode);
        }
    }, [actionCode, mode]);

    const handleEmailVerification = async (code: string) => {
        setIsVerifying(true);
        try {
            // Import Firebase functions
            const { httpsCallable } = await import('firebase/functions');
            const { functions } = await import('@repo/api/firebase/config');
            
            const verifyEmailFunction = httpsCallable(functions, 'verifyEmailToken');
            const result = await verifyEmailFunction({ token: code });
            const data = result.data as any;

            if (data.success) {
                setVerificationStatus('success');
                setMessage(data.message);
                toast({
                    title: t('verificationSuccessTitle'),
                    description: data.message,
                });
                
                // Redirect to dashboard after successful verification
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            } else {
                setVerificationStatus('error');
                setMessage(data.message);
                toast({
                    title: t('verificationFailedTitle'),
                    description: data.message,
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            setVerificationStatus('error');
            setMessage(error.message || t('verificationFailedGeneric'));
            toast({
                title: t('verificationFailedTitle'),
                description: error.message || t('verificationFailedGeneric'),
                variant: 'destructive',
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendVerification = async () => {
        setIsResending(true);
        try {
            // Import Firebase functions
            const { httpsCallable } = await import('firebase/functions');
            const { functions } = await import('@repo/api/firebase/config');
            const { auth } = await import('@repo/api/firebase/config');
            
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast({
                    title: t('errorTitle'),
                    description: t('notSignedIn'),
                    variant: 'destructive',
                });
                return;
            }

            const sendVerificationFunction = httpsCallable(functions, 'sendEmailVerification');
            const result = await sendVerificationFunction({ userId: currentUser.uid });
            const data = result.data as any;

            if (data.success) {
                toast({
                    title: t('resendSuccessTitle'),
                    description: data.message,
                });
            } else {
                toast({
                    title: t('resendFailedTitle'),
                    description: data.message,
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: t('resendFailedTitle'),
                description: error.message || t('resendFailedGeneric'),
                variant: 'destructive',
            });
        } finally {
            setIsResending(false);
        }
    };

    const getStatusIcon = () => {
        switch (verificationStatus) {
            case 'success':
                return <CheckCircle className="h-16 w-16 text-green-500" />;
            case 'error':
                return <XCircle className="h-16 w-16 text-red-500" />;
            default:
                return isVerifying ? 
                    <Loader2 className="h-16 w-16 text-primary animate-spin" /> :
                    <Mail className="h-16 w-16 text-primary" />;
        }
    };

    const getStatusTitle = () => {
        switch (verificationStatus) {
            case 'success':
                return t('verificationSuccessTitle');
            case 'error':
                return t('verificationFailedTitle');
            default:
                return isVerifying ? t('verifyingTitle') : t('title');
        }
    };

    const getStatusDescription = () => {
        if (message) return message;
        
        switch (verificationStatus) {
            case 'success':
                return t('verificationSuccessDescription');
            case 'error':
                return t('verificationFailedDescription');
            default:
                return isVerifying ? t('verifyingDescription') : t('description');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex items-center justify-center">
                        {getStatusIcon()}
                    </div>
                    <CardTitle className="font-headline text-2xl">
                        {getStatusTitle()}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {getStatusDescription()}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {verificationStatus === 'pending' && !isVerifying && (
                        <>
                            <div className="text-center text-sm text-muted-foreground">
                                {t('checkEmailInstructions')}
                            </div>
                            
                            <Button 
                                onClick={handleResendVerification}
                                disabled={isResending}
                                variant="outline"
                                className="w-full"
                            >
                                {isResending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                {t('resendButton')}
                            </Button>
                        </>
                    )}

                    {verificationStatus === 'success' && (
                        <div className="text-center">
                            <div className="text-sm text-muted-foreground mb-4">
                                {t('redirectingMessage')}
                            </div>
                            <Button 
                                onClick={() => router.push('/dashboard')}
                                className="w-full"
                            >
                                {t('continueToDashboard')}
                            </Button>
                        </div>
                    )}

                    {verificationStatus === 'error' && (
                        <div className="space-y-4">
                            <Button 
                                onClick={handleResendVerification}
                                disabled={isResending}
                                className="w-full"
                            >
                                {isResending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                {t('resendButton')}
                            </Button>
                            
                            <Button 
                                onClick={() => router.push('/login')}
                                variant="outline"
                                className="w-full"
                            >
                                {t('backToLogin')}
                            </Button>
                        </div>
                    )}

                    <div className="text-center text-sm text-muted-foreground">
                        {t('needHelp')} <a href="/support" className="text-primary hover:underline">{t('contactSupport')}</a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}