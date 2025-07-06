import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminDashboard.sidebar');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/40">
        <AdminSidebar adminName="SuperAdmin" t={t} />
        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
