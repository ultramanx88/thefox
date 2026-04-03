'use client';

import { EcommerceLayout } from '@/components/ecommerce';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle, Eye } from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
  // Mock order data - replace with API call
  const orders = [
    {
      id: 'TF123456789',
      date: '2024-01-15',
      status: 'delivered',
      total: 45.97,
      items: [
        { name: 'Fresh Organic Bananas', quantity: 2, price: 4.99 },
        { name: 'Premium Beef Steak', quantity: 1, price: 24.99 },
      ],
    },
    {
      id: 'TF987654321',
      date: '2024-01-10',
      status: 'in_transit',
      total: 32.48,
      items: [
        { name: 'Fresh Vegetables Mix', quantity: 3, price: 8.99 },
      ],
    },
    {
      id: 'TF456789123',
      date: '2024-01-05',
      status: 'confirmed',
      total: 18.99,
      items: [
        { name: 'Ocean Fresh Salmon', quantity: 1, price: 18.99 },
      ],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Package className="w-4 h-4" />;
      case 'in_transit':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <EcommerceLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Order History</h1>
          <Button asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">
              When you place your first order, it will appear here.
            </p>
            <Button asChild>
              <Link href="/">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.id}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <span>{formatStatus(order.status)}</span>
                        </span>
                      </Badge>
                      <p className="text-lg font-semibold mt-2">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          Reorder
                        </Button>
                      )}
                    </div>
                    
                    {order.status === 'in_transit' && (
                      <Button variant="outline" size="sm">
                        Track Package
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </EcommerceLayout>
  );
}