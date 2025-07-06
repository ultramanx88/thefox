'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

export function CancelJobButton({ acceptedAt }: { acceptedAt: string }) {
    const t = useTranslations('DriverJobs');
    const [isVisible, setIsVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180);

    useEffect(() => {
        const acceptedTime = new Date(acceptedAt).getTime();
        const now = Date.now();
        const threeMinutes = 3 * 60 * 1000;
        const elapsedTime = now - acceptedTime;

        if (elapsedTime < threeMinutes) {
            setIsVisible(true);
            setTimeLeft(Math.round((threeMinutes - elapsedTime) / 1000));

            const interval = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(interval);
                        setIsVisible(false);
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [acceptedAt]);

    if (!isVisible) {
        return null;
    }

    return (
        <Button variant="destructive" size="sm">
            <X className="mr-2 h-4 w-4" />
            {t('cancelJob')} ({timeLeft}s)
        </Button>
    );
}
