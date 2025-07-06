import Image from 'next/image';
import Link from 'next/link';
import { type Product } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rating } from './Rating';
import { Store } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`} className="group">
      <Card className="h-full overflow-hidden transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden xl:aspect-h-8 xl:aspect-w-7">
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={600}
              height={400}
              data-ai-hint={product.dataAiHint}
              className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="text-lg font-headline font-semibold text-foreground">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" />
            <span>{product.vendor}</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center p-4 pt-0">
          <p className="text-xl font-bold text-primary">${product.price.toFixed(2)}</p>
          <Rating rating={product.rating} reviewCount={product.reviewCount} />
        </CardFooter>
      </Card>
    </Link>
  );
}
