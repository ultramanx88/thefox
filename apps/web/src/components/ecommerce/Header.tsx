'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, User, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore, useUserStore } from '@/lib/store';
import { useWishlistStore } from '@/lib/wishlist-store';
import NotificationCenter from '../NotificationCenter';

export function EcommerceHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getItemCount, total } = useCartStore();
  const { user, isAuthenticated, logout } = useUserStore();
  const { getItemCount: getWishlistCount } = useWishlistStore();
  const itemCount = getItemCount();
  const wishlistCount = getWishlistCount();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm">
      {/* Top Bar */}
      <div className="bg-gray-50 py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <span>📧 hello@thefox.com</span>
              <span>Free Shipping for all Order of $99</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Link href="#" className="text-gray-600 hover:text-gray-800">Facebook</Link>
                <Link href="#" className="text-gray-600 hover:text-gray-800">Twitter</Link>
              </div>
              <select className="bg-transparent text-sm">
                <option>English</option>
                <option>ไทย</option>
              </select>
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  {user?.role === 'admin' && (
                    <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
                      Admin
                    </Link>
                  )}
                  <NotificationCenter />
                  <span>Welcome, {user?.name}</span>
                  <button onClick={handleLogout} className="text-gray-600 hover:text-gray-800">
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/auth/login" className="flex items-center space-x-1">
                  <User size={16} />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-green-600">
            TheFox
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-green-600">Home</Link>
            <Link href="/shop" className="text-gray-700 hover:text-green-600">Shop</Link>
            <Link href="/categories" className="text-gray-700 hover:text-green-600">Categories</Link>
            <Link href="/blog" className="text-gray-700 hover:text-green-600">Blog</Link>
            <Link href="/shipping" className="text-gray-700 hover:text-green-600">Track</Link>
            <Link href="/shipping-rates" className="text-gray-700 hover:text-green-600">Rates</Link>
            <Link href="/navigation" className="text-gray-700 hover:text-green-600">Navigate</Link>
            <Link href="/contact" className="text-gray-700 hover:text-green-600">Contact</Link>
          </nav>

          {/* Search & Cart */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <Input placeholder="Search products..." className="w-64" />
              <Button size="sm">
                <Search size={16} />
              </Button>
            </div>
            
            <Link href="/wishlist" className="relative">
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            
            <Link href="/cart" className="relative">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            
            <div className="text-sm">
              <span className="text-gray-600">Total: </span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu size={20} />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-2">
              <Link href="/" className="py-2 text-gray-700">Home</Link>
              <Link href="/shop" className="py-2 text-gray-700">Shop</Link>
              <Link href="/categories" className="py-2 text-gray-700">Categories</Link>
              <Link href="/blog" className="py-2 text-gray-700">Blog</Link>
              <Link href="/contact" className="py-2 text-gray-700">Contact</Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}