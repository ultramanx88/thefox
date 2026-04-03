import Link from 'next/link';
import { EcommerceLayout } from '@/components/ecommerce';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Package, Truck } from 'lucide-react';

export default function OrderSuccessPage() {
  const orderNumber = 'TF' + Math.random().toString(36).substr(2, 9).toUpperCase();

  return (
    <EcommerceLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              Order Placed Successfully!
            </h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="text-left space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Order Details</h3>
                  <p className="text-sm text-gray-600">
                    Order Number: <span className="font-mono font-medium">{orderNumber}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Estimated Delivery: 3-5 business days
                  </p>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-b">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">Order Confirmed</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Truck className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">In Transit</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">Delivered</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">
                    A confirmation email has been sent to your email address with order details and tracking information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/orders">View Order History</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
            
            <p className="text-sm text-gray-500">
              Need help? <Link href="/contact" className="text-green-600 hover:underline">Contact our support team</Link>
            </p>
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
}