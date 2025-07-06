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

// Mock data for demonstration
const mockProducts: Product[] = [
    {
      id: '1',
      name: 'กะหล่ำปลีออร์แกนิก',
      price: 35.0,
      imageUrl: 'https://placehold.co/600x400.png',
      vendor: 'ร้านผักป้านี',
      rating: 4.8,
      reviewCount: 75,
      dataAiHint: 'cabbage vegetable',
    },
    {
      id: '2',
      name: 'เนื้อสันในวัว',
      price: 350.0,
      imageUrl: 'https://placehold.co/600x400.png',
      vendor: 'เขียงเนื้อลุงเดช',
      rating: 5.0,
      reviewCount: 42,
      dataAiHint: 'beef steak',
    },
    {
      id: '3',
      name: 'มะม่วงน้ำดอกไม้',
      price: 60.0,
      imageUrl: 'https://placehold.co/600x400.png',
      vendor: 'สวนผลไม้ป้าไหว',
      rating: 4.9,
      reviewCount: 150,
      dataAiHint: 'mango fruit',
    },
    {
      id: '4',
      name: 'ปลาแซลมอนสด (ต่อ กก.)',
      price: 750.0,
      imageUrl: 'https://placehold.co/600x400.png',
      vendor: 'เจ๊ออยอาหารทะเล',
      rating: 4.9,
      reviewCount: 88,
      dataAiHint: 'salmon seafood',
    },
    {
      id: '5',
      name: 'ไข่ไก่เบอร์ 0 (แผง)',
      price: 120.0,
      imageUrl: 'https://placehold.co/600x400.png',
      vendor: 'ฟาร์มไก่ลุงมี',
      rating: 4.7,
      reviewCount: 210,
      dataAiHint: 'fresh eggs',
    },
    {
      id: '6',
      name: 'มะนาวแป้น (ต่อ กก.)',
      price: 40.0,
      imageUrl: 'https://placehold.co/600x400.png',
      vendor: 'ร้านผักป้านี',
      rating: 4.9,
      reviewCount: 180,
      dataAiHint: 'lime fruit',
    },
    {
      id: '7',
      name: 'อกไก่ (ต่อ กก.)',
      price: 85.0,
      imageUrl: 'https://placehold.co/600x400.png',
      vendor: 'ฟาร์มไก่ลุงมี',
      rating: 4.8,
      reviewCount: 195,
      dataAiHint: 'chicken breast',
    },
    {
      id: '8',
      name: 'กุ้งแม่น้ำ (ต่อ กก.)',
      price: 450.0,
      imageUrl: 'https://placehold.co/600x400.png',
      vendor: 'เจ๊ออยอาหารทะเล',
      rating: 4.8,
      reviewCount: 112,
      dataAiHint: 'river prawn',
    },
  ];

export default function ProductDetailPage({ params }: { params: { id: string, locale: string } }) {
  const t = useTranslations('ProductDetail');
  
  const [quantity, setQuantity] = useState(1);
  
  const product = {
    id: '1',
    name: 'กะหล่ำปลีออร์แกนิก',
    price: 35.0,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'cabbage vegetable',
    vendor: 'ร้านผักป้านี',
    vendorId: '456',
    rating: 4.8,
    reviewCount: 75,
    description: "กะหล่ำปลีสดใหม่จากฟาร์มออร์แกนิก ปลูกด้วยความใส่ใจ ปลอดสารเคมี เหมาะสำหรับทำอาหารได้หลากหลายเมนู",
  };

  const reviews = [
    { id: 1, author: 'ร้านอาหารเจริญสุข', rating: 5, comment: 'ผักสดดีมากครับ สั่งประจำ' },
    { id: 2, author: 'ครัวคุณหน่อย', rating: 4, comment: 'คุณภาพดี แต่บางครั้งขนาดไม่เท่ากัน' },
  ];
  
  const relatedProducts = mockProducts.filter(
    p => p.vendor === product.vendor && p.id !== product.id
  );

  const handleIncrease = () => setQuantity(prev => prev + 1);
  const handleDecrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

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
