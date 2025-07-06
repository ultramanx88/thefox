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
import { Boxes, LayoutDashboard, ShoppingCart, Clock } from 'lucide-react';

export function VendorSidebar({
  vendorName,
  t,
}: {
  vendorName: string;
  t: (key: string) => string;
}) {
  const pathname = usePathname();
  const menuItems = [
    { href: '/vendor', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/vendor/products', label: t('products'), icon: Boxes },
    { href: '/vendor/orders', label: t('orders'), icon: ShoppingCart },
    { href: '/vendor/hours', label: t('hours'), icon: Clock },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src="https://placehold.co/100x100.png"
              data-ai-hint="vendor avatar"
              alt={vendorName}
            />
            <AvatarFallback>{vendorName.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{vendorName}</span>
            <span className="text-xs text-muted-foreground">
              {t('vendor')}
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
                  isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/vendor')}
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
