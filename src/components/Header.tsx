'use client';

import Link from 'next/link';
import { ShoppingCart, Store, Leaf, User, Menu } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Marketplace' },
  { href: '/products/new', label: 'Sell Your Products' },
  { href: '/register/shopper', label: 'Become a Driver' },
];

export function Header() {
  const pathname = usePathname();

  const NavLinks = ({ className }: { className?: string }) => (
    <nav className={cn('flex items-center space-x-4 lg:space-x-6', className)}>
      {navLinks.map((link) => (
        <Button
          key={link.href}
          variant="ghost"
          asChild
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === link.href ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Link href={link.href}>{link.label}</Link>
        </Button>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">TaladMan</span>
          </Link>
          <NavLinks />
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <Link href="/" className="mr-6 flex items-center space-x-2 mb-4">
                <Leaf className="h-6 w-6 text-primary" />
                <span className="font-bold font-headline">TaladMan</span>
              </Link>
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    asChild
                    className={cn(
                      'justify-start',
                      pathname === link.href
                        ? 'text-primary bg-accent'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" size="icon">
            <ShoppingCart className="h-5 w-5" />
            <span className="sr-only">Cart</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/100x100.png" alt="@shadcn" data-ai-hint="user avatar" />
                  <AvatarFallback>TM</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Guest User</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    guest@taladman.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Store className="mr-2 h-4 w-4" />
                <Link href="/register/vendor">Vendor Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
