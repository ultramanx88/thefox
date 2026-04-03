import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function EcommerceFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="bg-green-600 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
              <p className="text-green-100">Get the latest deals and fresh product updates</p>
            </div>
            <div className="flex w-full md:w-auto">
              <Input 
                placeholder="Enter your email" 
                className="bg-white text-gray-900 border-0 rounded-r-none w-full md:w-80"
              />
              <Button className="bg-gray-900 hover:bg-gray-800 rounded-l-none">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-2xl font-bold text-green-400 mb-6">TheFox</h3>
              <p className="text-gray-300 mb-6">
                Your trusted partner for fresh, organic, and quality groceries delivered right to your doorstep.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  <Facebook size={20} />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  <Twitter size={20} />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  <Instagram size={20} />
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-300 hover:text-green-400 transition-colors">About Us</Link></li>
                <li><Link href="/shop" className="text-gray-300 hover:text-green-400 transition-colors">Shop</Link></li>
                <li><Link href="/categories" className="text-gray-300 hover:text-green-400 transition-colors">Categories</Link></li>
                <li><Link href="/blog" className="text-gray-300 hover:text-green-400 transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-green-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Customer Service</h4>
              <ul className="space-y-3">
                <li><Link href="/help" className="text-gray-300 hover:text-green-400 transition-colors">Help Center</Link></li>
                <li><Link href="/shipping" className="text-gray-300 hover:text-green-400 transition-colors">Shipping Info</Link></li>
                <li><Link href="/returns" className="text-gray-300 hover:text-green-400 transition-colors">Returns</Link></li>
                <li><Link href="/track-order" className="text-gray-300 hover:text-green-400 transition-colors">Track Order</Link></li>
                <li><Link href="/faq" className="text-gray-300 hover:text-green-400 transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Contact Info</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin size={18} className="text-green-400" />
                  <span className="text-gray-300">123 Market Street, Bangkok, Thailand</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone size={18} className="text-green-400" />
                  <span className="text-gray-300">+66 2 123 4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail size={18} className="text-green-400" />
                  <span className="text-gray-300">hello@thefox.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 TheFox. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-green-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-green-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-green-400 transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}