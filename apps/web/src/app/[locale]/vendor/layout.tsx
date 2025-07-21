import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { VendorSidebar } from '@/components/VendorSidebar';
import { getTranslations } from 'next-intl/server';

export default async function VendorLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = await getTranslations('VendorDashboard.sidebar');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/40">
        <VendorSidebar vendorName="ร้านผักป้านี" t={t} />
        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
