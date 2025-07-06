import type { Metadata } from 'next';
import {unstable_setRequestLocale} from 'next-intl/server';

export const metadata: Metadata = {
  title: 'TaladMan',
  description: 'Your local marketplace, connected.',
};

export default function LocaleLayout({
  children,
  params: {locale}
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  unstable_setRequestLocale(locale);
  // The main layout and provider are now in `src/app/layout.tsx`
  return children;
}
