'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { type Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';

import { Rating } from "@/components/Rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Store, Truck, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { Link } from '@/navigation';

interface ProductDetailClientProps {
    product: Product;
    relatedProducts: Product[];
    // Mocking reviews for now
    reviews: { id: number, author: string, rating: number, comment: string }[];
}

export function ProductDetailClient({ product, relatedProducts, reviews }: ProductDetailClientProps) {
  const t = useTranslations('ProductDetail');
  
  const [quantity, setQuantity] = useState(1);

  const handleIncrease = () => setQuantity(prev => prev + 1);
  const handleDecrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  if (!product) return null; // Should be handled by notFound() in parent

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square bg-card p-4 rounded-lg">
            <Image
                src={product.imageUrl}
                alt={product.name}
                width={800}
                height={800}
                data-ai-hint={product.dataAiHint}
                className="w-full h-full object-contain rounded-lg"
            />
        </div>

        <div className="py-4">
            <h1 className="font-headline text-4xl font-bold">{product.name}</h1>
            <Link href={`/vendors/${product.vendorId}`}>
                <div className="mt-2 flex items-center gap-2 text-md text-muted-foreground hover:text-primary transition-colors">
                    <Store className="h-5 w-5" />
                    <span>{product.vendor}</span>
                </div>
            </Link>
            
            <div className="my-4">
                <Rating rating={product.rating} reviewCount={product.reviewCount} />
            </div>

            <p className="text-4xl font-bold text-primary my-4">฿{(product.price * quantity).toFixed(2)}</p>

            <p className="text-foreground/80 leading-relaxed">{product.description}</p>
            
            <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-md border">
                    <Button variant="ghost" size="icon" onClick={handleDecrease} className="h-11 w-11">
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center text-lg font-bold">{quantity}</span>
                    <Button variant="ghost" size="icon" onClick={handleIncrease} className="h-11 w-11">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 flex-1">{t('addToCart')}</Button>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4"/>
                <span>{t('deliveryInfo')}</span>
            </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <>
            <Separator className="my-12" />
            <div>
                <h2 className="font-headline text-3xl font-bold mb-6">{t('relatedProducts')}</h2>
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                    {relatedProducts.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </div>
        </>
      )}

      <Separator className="my-12"/>

      <div>
        <h2 className="font-headline text-3xl font-bold mb-6">{t('customerReviews')}</h2>
        <div className="space-y-6">
            {reviews.map(review => (
                <Card key={review.id}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-base font-medium">{review.author}</CardTitle>
                        </div>
                        <Rating rating={review.rating} reviewCount={0} />
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{review.comment}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
