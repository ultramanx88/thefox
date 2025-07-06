import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Toaster />
    </div>
  );
}
