import {NextIntlClientProvider} from 'next-intl';
import {getMessages, unstable_setRequestLocale} from 'next-intl/server';
import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';

export default async function LocaleLayout({
  children,
  params: {locale}
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  unstable_setRequestLocale(locale);
  const messages = await getMessages();
 
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                {children}
            </main>
            <Toaster />
        </div>
    </NextIntlClientProvider>
  );
}
