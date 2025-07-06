import { Rating } from "@/components/Rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Store, Truck } from "lucide-react";
import Image from "next/image";
import { Link } from '@/navigation';
import {unstable_setRequestLocale} from 'next-intl/server';

export default function ProductDetailPage({ params }: { params: { id: string, locale: string } }) {
  unstable_setRequestLocale(params.locale);
  // Mock data for a single product
  const product = {
    id: '1',
    name: 'Organic Avocados',
    price: 4.99,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'avocado fruit',
    vendor: 'Green Farms',
    vendorId: '123',
    rating: 4.5,
    reviewCount: 120,
    description: "Grown with care on our family farm, these organic avocados are creamy, delicious, and packed with nutrients. Perfect for toast, salads, or guacamole. Sold by the pound.",
  };

  const reviews = [
    { id: 1, author: 'Alice', rating: 5, comment: 'So fresh and creamy! Best avocados I have ever had.' },
    { id: 2, author: 'Bob', rating: 4, comment: 'Great quality, but took a bit long to ripen.' },
  ];

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

            <p className="text-4xl font-bold text-primary my-4">${product.price.toFixed(2)}</p>

            <p className="text-foreground/80 leading-relaxed">{product.description}</p>
            
            <div className="mt-6">
                <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90">Add to Cart</Button>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4"/>
                <span>Fast, local delivery available.</span>
            </div>
        </div>
      </div>

      <Separator className="my-12"/>

      <div>
        <h2 className="font-headline text-3xl font-bold mb-6">Customer Reviews</h2>
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
