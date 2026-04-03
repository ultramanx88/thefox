'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  'Fresh Meat',
  'Vegetables', 
  'Fruit & Nut Gifts',
  'Fresh Berries',
  'Ocean Foods',
  'Butter & Eggs',
  'Fastfood',
  'Fresh Onion',
  'Papaya & Crisps',
  'Oatmeal',
  'Fresh Bananas'
];

export function HeroSection() {
  const [showCategories, setShowCategories] = useState(false);

  return (
    <section className="bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex">
          {/* Categories Sidebar */}
          <div className="w-80 bg-white rounded-lg shadow-sm mr-6">
            <div 
              className="flex items-center justify-between p-4 bg-green-600 text-white rounded-t-lg cursor-pointer"
              onClick={() => setShowCategories(!showCategories)}
            >
              <span className="font-medium">All departments</span>
              <ChevronDown className={`transform transition-transform ${showCategories ? 'rotate-180' : ''}`} />
            </div>
            
            {showCategories && (
              <div className="py-2">
                {categories.map((category, index) => (
                  <Link 
                    key={index}
                    href={`/categories/${category.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-colors"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Hero Banner */}
          <div className="flex-1 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white p-12 relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-5xl font-bold mb-4">
                Fresh & Organic<br />
                <span className="text-yellow-300">Grocery Store</span>
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Get the best quality organic products delivered to your doorstep
              </p>
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                Shop Now
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 translate-x-24"></div>
          </div>
        </div>
      </div>
    </section>
  );
}