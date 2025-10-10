'use client';

import { usePathname, useRouter, Link } from '@/navigation';
import { ShoppingCart, Menu, Leaf, Phone, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { cn } from '@/lib/utils';
import React from 'react';

export function Header() {
  const pathname = usePathname();
  const navLinks = [
    { href: '/', label: 'หน้าแรก' },
    { href: '/vendors', label: 'ร้านค้า' },
    { href: '/products/new', label: 'สินค้าใหม่' },
  ];

  const NavLinks = ({ className }: { className?: string }) => (
    <nav className={cn('flex items-center gap-6 text-sm font-medium', className)}>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href as any}
          className={cn(
            'transition-colors hover:text-emerald-700',
            pathname === link.href ? 'text-emerald-700' : 'text-gray-600'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="bg-emerald-600 text-white">
        <div className="container mx-auto flex h-8 items-center justify-between px-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> 02-123-4567</div>
            <div className="hidden sm:flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> กรุงเทพฯ</div>
          </div>
          <div className="hidden sm:block">ส่งฟรีเมื่อสั่งซื้อครบ 499 บาท</div>
        </div>
      </div>

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Leaf className="h-7 w-7 text-emerald-600" />
          <span className="font-headline text-xl font-bold tracking-tight">theFOX</span>
        </div>

        <div className="hidden md:block">
          <NavLinks />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex border-emerald-600 text-emerald-700 hover:bg-emerald-50">เข้าสู่ระบบ</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">สมัครสมาชิก</Button>
          <Button variant="ghost" size="icon">
            <ShoppingCart className="h-5 w-5" />
            <span className="sr-only">Cart</span>
          </Button>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="h-6 w-6 text-emerald-600" />
                  <span className="font-headline text-lg font-bold">theFOX</span>
                </div>
                <div className="flex flex-col gap-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href as any}
                      className={cn(
                        'px-2 py-2 rounded hover:bg-emerald-50',
                        pathname === link.href ? 'text-emerald-700' : 'text-gray-700'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
