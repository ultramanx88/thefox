'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { Rating } from "@/components/Rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Store, Truck, Calendar as CalendarIcon, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { Link } from '@/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProductDetailPage({ params }: { params: { id: string, locale: string } }) {
  const t = useTranslations('ProductDetail');
  
  const [deliveryOption, setDeliveryOption] = useState('now');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [quantity, setQuantity] = useState(1);
  
  const timeSlots = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'];

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
            
            <Card className="mt-6 bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-xl">{t('scheduling.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption} className="grid grid-cols-2 gap-4">
                        <div>
                            <RadioGroupItem value="now" id="now" className="peer sr-only" />
                            <Label htmlFor="now" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center">
                            {t('scheduling.deliverNow')}
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="later" id="later" className="peer sr-only" />
                            <Label htmlFor="later" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center">
                            {t('scheduling.scheduleLater')}
                            </Label>
                        </div>
                    </RadioGroup>
                    {deliveryOption === 'later' && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>{t('scheduling.selectDate')}</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>{t('scheduling.selectDate')}</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('scheduling.selectTime')}</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('scheduling.selectTime')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeSlots.map(slot => (
                                            <SelectItem key={slot} value={t(`scheduling.timeSlots.${slot}` as any)}>
                                                {t(`scheduling.timeSlots.${slot}` as any)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

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
