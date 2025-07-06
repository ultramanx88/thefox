'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LanguageBadgeProps {
  lang: 'zh' | 'ja' | 'ko';
  className?: string;
}

export function LanguageBadge({ lang, className }: LanguageBadgeProps) {
  const t = useTranslations('Languages');

  const langMap = {
    zh: t('chinese'),
    ja: t('japanese'),
    ko: t('korean'),
  };

  return (
    <Badge variant="secondary" className={cn('font-normal', className)}>
      {langMap[lang]}
    </Badge>
  );
}
