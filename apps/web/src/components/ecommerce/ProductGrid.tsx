'use client';

import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { useProducts } from '@/lib/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  isNew?: boolean;
  discount?: number;
}

export function ProductGrid() {
  const { addItem } = useCartStore();
  const { data: products, isLoading, error } = useProducts();

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-600">Fresh and organic products for healthy living</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm">
                <Skeleton className="w-full h-64 rounded-t-lg" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Unable to load products</h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </section>
    );
  }

  // Fallback to sample data if API returns empty
  const sampleProducts: Product[] = [
    {
      id: '1',
      name: 'Fresh Organic Bananas',
      price: 4.99,
      originalPrice: 6.99,
      image: '/api/placeholder/300/300',
      category: 'Fruits',
      rating: 4.5,
      isNew: true,
      discount: 30
    },
    {
      id: '2', 
      name: 'Premium Beef Steak',
      price: 24.99,
      image: '/api/placeholder/300/300',
      category: 'Meat',
      rating: 4.8
    },
    {
      id: '3',
      name: 'Fresh Vegetables Mix',
      price: 8.99,
      originalPrice: 12.99,
      image: '/api/placeholder/300/300',
      category: 'Vegetables',
      rating: 4.3,
      discount: 25
    },
    {
      id: '4',
      name: 'Ocean Fresh Salmon',
      price: 18.99,
      image: '/api/placeholder/300/300',
      category: 'Seafood',
      rating: 4.7,
      isNew: true
    }
  ];

  const displayProducts = products?.data || sampleProducts;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
          <p className="text-gray-600">Fresh and organic products for healthy living</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product: Product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow group">
              <div className="relative overflow-hidden rounded-t-lg">
                <Link href={`/products/${product.id}`}>
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                  />
                </Link>
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.isNew && <Badge className="bg-green-500">New</Badge>}
                  {product.discount && <Badge variant="destructive">{product.discount}% OFF</Badge>}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" className="w-10 h-10 p-0">
                    <Heart size={16} />
                  </Button>
                  <Button size="sm" variant="secondary" className="w-10 h-10 p-0" asChild>
                    <Link href={`/products/${product.id}`}>
                      <Eye size={16} />
                    </Link>
                  </Button>
                </div>

                {/* Quick Add to Cart */}
                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart size={16} className="mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-500 mb-1">{product.category}</p>
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-semibold mb-2 line-clamp-2 hover:text-green-600 cursor-pointer">{product.name}</h3>
                </Link>
                
                {/* Rating */}
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">({product.rating})</span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600">${product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild>
            <Link href="/shop">View All Products</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}