'use client';

import { usePathname, Link } from '@/src/navigation';
import { ShoppingCart, Menu, Dog, Phone, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { cn } from '@/src/lib/utils';
import { useCartStore } from '../store/cart';
import React from 'react';

import { AuthService } from '../services/authService';
import { UserProfile } from '../types';

export function Header() {
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const [locationName, setLocationName] = React.useState('กรุงเทพฯ');
  const [isDetecting, setIsDetecting] = React.useState(false);
  const [user, setUser] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    // Check initial auth state or session could be done via callback
    const unsubscribe = AuthService.onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Typically you'd fetch the profile from Firestore or state
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          role: 'customer', // Default
          createdAt: new Date().toISOString()
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const profile = await AuthService.signInWithGoogle();
    if (profile) setUser(profile);
  };

  const handleLogout = async () => {
    await AuthService.signOut();
    setUser(null);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use a free reverse geocoding API (Nominatim)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { 'Accept-Language': 'th' } }
          );
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.state || 'ตำแหน่งปัจจุบัน';
          setLocationName(city);
        } catch (error) {
          console.error('Error fetching location name:', error);
          setLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsDetecting(false);
        alert('ไม่สามารถระบุตำแหน่งได้ โปรดตรวจสอบการตั้งค่าความเป็นส่วนตัว');
      }
    );
  };
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
            'transition-colors hover:text-rose-600',
            pathname === link.href ? 'text-rose-600' : 'text-gray-600'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="bg-rose-600 text-white">
        <div className="container mx-auto flex h-8 items-center justify-between px-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> 02-123-4567</div>
            <button 
              onClick={detectLocation}
              disabled={isDetecting}
              className="hidden sm:flex items-center gap-1 hover:text-rose-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <MapPin className="h-3.5 w-3.5" /> 
              {isDetecting ? 'กำลังระบุตำแหน่ง...' : locationName}
            </button>
          </div>
          <div className="hidden sm:block">ส่งฟรีเมื่อสั่งซื้อครบ 499 บาท</div>
        </div>
      </div>

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Dog className="h-7 w-7 text-rose-600" />
          <span className="font-headline text-xl font-bold tracking-tight">theFOX</span>
        </div>

        <div className="hidden md:block">
          <NavLinks />
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-sm font-medium text-gray-700">
                สวัสดี, {user.displayName?.split(' ')[0]}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-rose-600 hover:text-rose-700 font-medium"
                onClick={handleLogout}
              >
                ออกจากระบบ
              </Button>
            </div>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:inline-flex border-rose-600 text-rose-700 hover:bg-rose-50"
                onClick={handleLogin}
              >
                เข้าสู่ระบบ
              </Button>
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleLogin}>
                สมัครสมาชิก
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
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
                  <Dog className="h-6 w-6 text-rose-600" />
                  <span className="font-headline text-lg font-bold">theFOX</span>
                </div>
                <div className="flex flex-col gap-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href as any}
                      className={cn(
                        'px-2 py-2 rounded hover:bg-rose-50',
                        pathname === link.href ? 'text-rose-700' : 'text-gray-700'
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
