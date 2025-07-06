import { Rating } from "@/components/Rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Store, Truck } from "lucide-react";
import Image from "next/image";
import { Link } from '@/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

export default async function ProductDetailPage({ params }: { params: { id: string, locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations('ProductDetail');
  
  const product = {
    id: '2',
    name: 'เนื้อสันในวัว',
    price: 350.0,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'beef steak',
    vendor: 'เขียงเนื้อลุงเดช',
    vendorId: '123',
    rating: 5.0,
    reviewCount: 42,
    description: "เนื้อสันในวัวคุณภาพเยี่ยมจากฟาร์มท้องถิ่น นุ่มและเหมาะสำหรับทำสเต็กหรืออาหารมื้อพิเศษ ขายต่อกิโลกรัม",
  };

  const reviews = [
    { id: 1, author: 'ร้านอาหารเจริญสุข', rating: 5, comment: 'เนื้อดีมากครับ สั่งประจำ' },
    { id: 2, author: 'ครัวคุณหน่อย', rating: 4, comment: 'คุณภาพดี แต่บางครั้งก็หมดเร็ว' },
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

            <p className="text-4xl font-bold text-primary my-4">฿{product.price.toFixed(2)}</p>

            <p className="text-foreground/80 leading-relaxed">{product.description}</p>
            
            <div className="mt-6">
                <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90">{t('addToCart')}</Button>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4"/>
                <span>{t('deliveryInfo')}</span>
            </div>
        </div>
      </div>

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
