import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Truck } from "lucide-react";
import Image from "next/image";
import {unstable_setRequestLocale} from 'next-intl/server';

export default function OrderTrackingPage({ params }: { params: { id: string, locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const steps = [
    { name: 'Order Placed', icon: CheckCircle, status: 'completed' },
    { name: 'Processing', icon: Package, status: 'completed' },
    { name: 'Out for Delivery', icon: Truck, status: 'active' },
    { name: 'Delivered', icon: CheckCircle, status: 'pending' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Order Tracking</CardTitle>
          <p className="text-muted-foreground">Order ID: #{params.id}</p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Order Status</h3>
                <div className="relative pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 ml-[12px]"></div>
                {steps.map((step, index) => (
                    <div key={index} className="relative mb-8 flex items-start">
                    <div className={`z-10 flex h-6 w-6 items-center justify-center rounded-full ${step.status === 'completed' ? 'bg-primary' : step.status === 'active' ? 'bg-accent animate-pulse' : 'bg-muted'}`}>
                        <step.icon className={`h-4 w-4 ${step.status === 'pending' ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
                    </div>
                    <div className="ml-4">
                        <h4 className="font-semibold">{step.name}</h4>
                        <p className="text-sm text-muted-foreground">
                        {step.status === 'completed' && 'Completed'}
                        {step.status === 'active' && 'In Progress'}
                        {step.status === 'pending' && 'Pending'}
                        </p>
                    </div>
                    </div>
                ))}
                </div>
            </div>

            <div className="bg-muted rounded-lg overflow-hidden h-64 md:h-full">
                <Image
                    src="https://placehold.co/800x600.png"
                    data-ai-hint="map route"
                    alt="Map showing delivery route"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover"
                />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
