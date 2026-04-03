'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { EcommerceLayout } from '@/components/ecommerce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Heart, ShoppingCart, Star, Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCartStore();

  // Mock product data - replace with API call
  const product = {
    id: params.id as string,
    name: 'Fresh Organic Bananas',
    price: 4.99,
    originalPrice: 6.99,
    images: [
      'https://via.placeholder.com/500x500',
      'https://via.placeholder.com/500x500',
      'https://via.placeholder.com/500x500',
    ],
    category: 'Fruits',
    rating: 4.5,
    reviews: 128,
    inStock: true,
    description: 'Fresh organic bananas sourced directly from local farms. Rich in potassium and perfect for a healthy diet.',
    features: [
      'Organic certified',
      'Locally sourced',
      'Rich in potassium',
      'Perfect ripeness',
    ],
    discount: 30,
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity,
    });
    
    toast({
      title: 'Added to cart',
      description: `${quantity}x ${product.name} added to your cart`,
    });
  };

  return (
    <EcommerceLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="mb-4">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
            <div className="flex space-x-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded border-2 ${
                    selectedImage === index ? 'border-green-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <Badge variant="secondary" className="mb-2">
                {product.category}
              </Badge>
              {product.discount && (
                <Badge variant="destructive" className="ml-2">
                  {product.discount}% OFF
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.floor(product.rating) ? 'fill-current' : ''}
                  />
                ))}
              </div>
              <span className="ml-2 text-gray-600">
                ({product.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center mb-6">
              <span className="text-3xl font-bold text-green-600">
                ${product.price}
              </span>
              {product.originalPrice && (
                <span className="ml-3 text-xl text-gray-400 line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6">{product.description}</p>

            {/* Features */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Features:</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Separator className="my-6" />

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border rounded">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1"
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="mr-2" size={20} />
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                <Button variant="outline" size="lg">
                  <Heart size={20} />
                </Button>
              </div>

              {product.inStock && (
                <p className="text-sm text-green-600">✓ In stock and ready to ship</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
}