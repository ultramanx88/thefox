import { ProductCard } from '@/components/ProductCard';
import { type Product } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Organic Avocados',
    price: 4.99,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Green Farms',
    rating: 4.5,
    reviewCount: 120,
    dataAiHint: 'avocado fruit',
  },
  {
    id: '2',
    name: 'Handmade Leather Wallet',
    price: 45.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Artisan Crafts',
    rating: 5.0,
    reviewCount: 89,
    dataAiHint: 'leather wallet',
  },
  {
    id: '3',
    name: 'Vintage T-Shirt',
    price: 25.5,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Retro Wears',
    rating: 4.0,
    reviewCount: 45,
    dataAiHint: 'vintage t-shirt',
  },
  {
    id: '4',
    name: 'Gourmet Coffee Beans',
    price: 18.75,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'The Daily Grind',
    rating: 4.8,
    reviewCount: 250,
    dataAiHint: 'coffee beans',
  },
  {
    id: '5',
    name: 'Wireless Headphones',
    price: 120.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Techify',
    rating: 4.7,
    reviewCount: 530,
    dataAiHint: 'wireless headphones',
  },
  {
    id: '6',
    name: 'Fresh Sourdough Bread',
    price: 7.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Bakery Bliss',
    rating: 4.9,
    reviewCount: 95,
    dataAiHint: 'sourdough bread',
  },
  {
    id: '7',
    name: 'Ceramic Plant Pot',
    price: 22.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Home Grown',
    rating: 4.6,
    reviewCount: 77,
    dataAiHint: 'ceramic pot',
  },
  {
    id: '8',
    name: 'Natural Soy Candle',
    price: 15.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'Scented Escapes',
    rating: 4.8,
    reviewCount: 150,
    dataAiHint: 'soy candle',
  },
];

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          Explore Fresh Finds
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Discover unique items from local vendors and personal shoppers near you.
        </p>
      </div>
      <Separator className="mb-8" />
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {mockProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
