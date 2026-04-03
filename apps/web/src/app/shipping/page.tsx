'use client';

import { useState } from 'react';
import { Package, Truck, MapPin, Clock, CheckCircle } from 'lucide-react';

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location: string;
  timestamp: string;
  completed: boolean;
}

interface ShipmentInfo {
  trackingNumber: string;
  status: 'processing' | 'shipped' | 'in_transit' | 'delivered';
  estimatedDelivery: string;
  carrier: string;
  events: TrackingEvent[];
}

export default function ShippingTracker() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipment, setShipment] = useState<ShipmentInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const mockShipment: ShipmentInfo = {
    trackingNumber: 'TF123456789',
    status: 'in_transit',
    estimatedDelivery: '2024-01-20',
    carrier: 'FedEx',
    events: [
      {
        id: '1',
        status: 'Order Placed',
        description: 'Your order has been confirmed and is being prepared',
        location: 'TheFox Warehouse',
        timestamp: '2024-01-15T10:00:00Z',
        completed: true
      },
      {
        id: '2',
        status: 'Processing',
        description: 'Items are being picked and packed',
        location: 'TheFox Warehouse',
        timestamp: '2024-01-15T14:30:00Z',
        completed: true
      },
      {
        id: '3',
        status: 'Shipped',
        description: 'Package has been shipped',
        location: 'New York, NY',
        timestamp: '2024-01-16T09:15:00Z',
        completed: true
      },
      {
        id: '4',
        status: 'In Transit',
        description: 'Package is on the way to destination',
        location: 'Philadelphia, PA',
        timestamp: '2024-01-17T16:45:00Z',
        completed: true
      },
      {
        id: '5',
        status: 'Out for Delivery',
        description: 'Package is out for delivery',
        location: 'Boston, MA',
        timestamp: '2024-01-18T08:00:00Z',
        completed: false
      },
      {
        id: '6',
        status: 'Delivered',
        description: 'Package delivered successfully',
        location: 'Your Address',
        timestamp: '2024-01-18T15:30:00Z',
        completed: false
      }
    ]
  };

  const handleTrack = async () => {
    if (!trackingNumber.trim()) return;
    
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShipment(mockShipment);
    setLoading(false);
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    if (completed) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
    
    switch (status.toLowerCase()) {
      case 'processing':
        return <Package className="h-6 w-6 text-blue-600" />;
      case 'shipped':
      case 'in transit':
        return <Truck className="h-6 w-6 text-yellow-600" />;
      case 'delivered':
        return <MapPin className="h-6 w-6 text-green-600" />;
      default:
        return <Clock className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-gray-600">Enter your tracking number to see the latest updates</p>
        </div>

        {/* Tracking Input */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex space-x-4">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number (e.g., TF123456789)"
              className="flex-1 px-4 py-3 border rounded-lg"
            />
            <button
              onClick={handleTrack}
              disabled={loading}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </div>
        </div>

        {/* Shipment Info */}
        {shipment && (
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Tracking #{shipment.trackingNumber}
                  </h2>
                  <p className="text-gray-600">Carrier: {shipment.carrier}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shipment.status)}`}>
                  {shipment.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Current Status</p>
                    <p className="font-medium">{shipment.status.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Estimated Delivery</p>
                    <p className="font-medium">
                      {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Tracking History</h3>
              
              <div className="relative">
                {shipment.events.map((event, index) => (
                  <div key={event.id} className="flex items-start space-x-4 pb-6">
                    <div className="flex-shrink-0">
                      {getStatusIcon(event.status, event.completed)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-medium ${event.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                            {event.status}
                          </h4>
                          <p className={`text-sm ${event.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                            {event.description}
                          </p>
                          <p className={`text-sm ${event.completed ? 'text-gray-500' : 'text-gray-400'}`}>
                            {event.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm ${event.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                            {event.completed 
                              ? new Date(event.timestamp).toLocaleDateString()
                              : 'Pending'
                            }
                          </p>
                          <p className={`text-xs ${event.completed ? 'text-gray-500' : 'text-gray-400'}`}>
                            {event.completed 
                              ? new Date(event.timestamp).toLocaleTimeString()
                              : ''
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {index < shipment.events.length - 1 && (
                      <div className="absolute left-3 mt-8 w-0.5 h-6 bg-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Instructions */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-medium text-blue-900 mb-2">Delivery Instructions</h3>
              <p className="text-blue-800 text-sm">
                Please ensure someone is available to receive the package. If you're not available, 
                the package will be left in a safe location or with a neighbor.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}