import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { OneClickInstallProvider } from '@/contexts/OneClickInstallContext';
import { FloatingInstallButton } from '@/components/pwa/InstallButton';

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = useMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <OneClickInstallProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Toaster />
          <FloatingInstallButton />
        </div>
      </OneClickInstallProvider>
    </NextIntlClientProvider>
  );
}
