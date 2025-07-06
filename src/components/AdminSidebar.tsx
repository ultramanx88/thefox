'use client';

import { usePathname, Link } from '@/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Boxes, LayoutDashboard, Settings, Calculator } from 'lucide-react';

export function AdminSidebar({
  adminName,
  t,
}: {
  adminName: string;
  t: (key: string) => string;
}) {
  const pathname = usePathname();
  const menuItems = [
    { href: '/admin', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/admin/categories', label: t('categories'), icon: Boxes },
    { href: '/admin/fees', label: t('feeSimulator'), icon: Calculator },
    { href: '/admin/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src="https://placehold.co/100x100.png"
              data-ai-hint="admin avatar"
              alt={adminName}
            />
            <AvatarFallback>{adminName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{adminName}</span>
            <span className="text-xs text-muted-foreground">
              {t('superAdmin')}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} className="w-full">
                <SidebarMenuButton
                  isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin')}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
