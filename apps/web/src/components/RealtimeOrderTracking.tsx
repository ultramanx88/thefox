/**
 * Real-time Order Tracking Components
 * Components for tracking orders, delivery status, and live updates
 */

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  User, 
  Phone,
  MessageCircle,
  Navigation,
  AlertCircle
} from 'lucide-react';
import { 
  useRealtimeOrder,
  useRealtimeOrderStatus,
  useRealtimeDeliveryTracking,
  useRealtimeMarketAvailability 
} from '@/hooks/useRealtime';

// ===========================================
// ORDER STATUS TIMELINE
// ===========================================

interface OrderStatusTimelineProps {
  orderId: string;
  className?: string;
}

export function OrderStatusTimeline({ orderId, className = '' }: OrderStatusTimelineProps) {
  const { status, statusHistory, loading, error } = useRealtimeOrderStatus(orderId);

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Package },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { key: 'preparing', label: 'Preparing', icon: Clock },
    { key: 'ready', label: 'Ready for Pickup', icon: Package },
    { key: 'delivering', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const getStepStatus = (stepKey: string) => {
    if (!status) return 'pending';
    
    const stepIndex = statusSteps.findIndex(step => step.key === stepKey);
    const currentIndex = statusSteps.findIndex(step => step.key === status);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStepColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'current': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-400 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 ${className}`}>
        <AlertCircle className="h-5 w-5 inline mr-2" />
        Failed to load order status
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="space-y-4">
        {statusSteps.map((step, index) => {
          const stepStatus = getStepStatus(step.key);
          const Icon = step.icon;
          
          return (
            <div key={step.key} className="flex items-center space-x-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${getStepColor(stepStatus)}
              `}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1">
                <div className={`
                  font-medium
                  ${stepStatus === 'completed' ? 'text-green-600' : 
                    stepStatus === 'current' ? 'text-blue-600' : 'text-gray-400'}
                `}>
                  {step.label}
                </div>
                
                {stepStatus === 'current' && (
                  <div className="text-sm text-gray-600 mt-1">
                    In progress...
                  </div>
                )}
                
                {stepStatus === 'completed' && statusHistory.length > 0 && (
                  <div className="text-sm text-gray-500 mt-1">
                    {/* Show timestamp from status history */}
                    Completed
                  </div>
                )}
              </div>
              
              {index < statusSteps.length - 1 && (
                <div className={`
                  w-px h-8 ml-4
                  ${stepStatus === 'completed' ? 'bg-green-200' : 'bg-gray-200'}
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================
// DELIVERY TRACKING MAP
// ===========================================

interface DeliveryTrackingProps {
  orderId: string;
  className?: string;
}

export function DeliveryTracking({ orderId, className = '' }: DeliveryTrackingProps) {
  const { data: trackingData, loading, error } = useRealtimeDeliveryTracking(orderId);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (trackingData && trackingData.length > 0) {
      const latest = trackingData[0];
      if (latest.location) {
        setCurrentLocation(latest.location);
      }
    }
  }, [trackingData]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (error || !trackingData || trackingData.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <MapPin className="h-8 w-8 mx-auto mb-2" />
        <p>Delivery tracking not available</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Live Tracking</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live</span>
          </div>
        </div>

        {/* Mock map placeholder */}
        <div className="h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Map View</p>
            {currentLocation && (
              <p className="text-xs text-gray-400 mt-1">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* Recent tracking updates */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Recent Updates</h4>
          <div className="max-h-32 overflow-y-auto space-y-2">
            {trackingData.slice(0, 5).map((update, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <div className="text-gray-900 capitalize">{update.type.replace('_', ' ')}</div>
                  <div className="text-gray-500 text-xs">
                    {new Date(update.timestamp?.toDate()).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// DRIVER INFORMATION
// ===========================================

interface DriverInfoProps {
  orderId: string;
  className?: string;
}

export function DriverInfo({ orderId, className = '' }: DriverInfoProps) {
  const { data: order, loading } = useRealtimeOrder(orderId);
  const [driverInfo, setDriverInfo] = useState<any>(null);

  useEffect(() => {
    // In a real app, you would fetch driver info based on order.driverId
    if (order?.driverId) {
      setDriverInfo({
        id: order.driverId,
        name: 'John Doe',
        phone: '+66 81 234 5678',
        rating: 4.8,
        vehicle: 'Honda Wave 125',
        licensePlate: 'ABC 1234',
      });
    }
  }, [order?.driverId]);

  if (loading || !order?.driverId || !driverInfo) {
    return null;
  }

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Your Driver</h3>
        <div className="flex items-center space-x-1">
          <span className="text-sm text-yellow-600">★</span>
          <span className="text-sm text-gray-600">{driverInfo.rating}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <User className="h-6 w-6 text-gray-400" />
        </div>
        
        <div className="flex-1">
          <div className="font-medium text-gray-900">{driverInfo.name}</div>
          <div className="text-sm text-gray-600">{driverInfo.vehicle}</div>
          <div className="text-sm text-gray-500">{driverInfo.licensePlate}</div>
        </div>
      </div>

      <div className="flex space-x-2 mt-4">
        <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <Phone className="h-4 w-4" />
          <span>Call</span>
        </button>
        
        <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <MessageCircle className="h-4 w-4" />
          <span>Message</span>
        </button>
      </div>
    </div>
  );
}

// ===========================================
// ORDER SUMMARY CARD
// ===========================================

interface OrderSummaryProps {
  orderId: string;
  className?: string;
}

export function OrderSummary({ orderId, className = '' }: OrderSummaryProps) {
  const { data: order, loading, error } = useRealtimeOrder(orderId);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white border rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={`text-red-600 ${className}`}>
        <AlertCircle className="h-5 w-5 inline mr-2" />
        Failed to load order details
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Order #{orderId.slice(-6)}</h3>
        <span className={`
          px-2 py-1 text-xs rounded-full
          ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
            order.status === 'delivering' ? 'bg-blue-100 text-blue-800' :
            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'}
        `}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Market:</span>
          <span className="font-medium">{order.marketName}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Items:</span>
          <span className="font-medium">{order.items?.length || 0} items</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Total:</span>
          <span className="font-medium">฿{order.totalAmount?.toFixed(2)}</span>
        </div>
        
        {order.estimatedDeliveryTime && (
          <div className="flex justify-between">
            <span className="text-gray-600">ETA:</span>
            <span className="font-medium">
              {new Date(order.estimatedDeliveryTime.toDate()).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {order.items && order.items.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
          <div className="space-y-1">
            {order.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium">฿{item.subtotal?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// COMPREHENSIVE ORDER TRACKING
// ===========================================

interface OrderTrackingPageProps {
  orderId: string;
  className?: string;
}

export function OrderTrackingPage({ orderId, className = '' }: OrderTrackingPageProps) {
  const { status } = useRealtimeOrderStatus(orderId);
  const showDeliveryTracking = status === 'delivering' || status === 'delivered';

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Order Summary */}
      <OrderSummary orderId={orderId} />

      {/* Status Timeline */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Status</h2>
        <OrderStatusTimeline orderId={orderId} />
      </div>

      {/* Delivery Tracking (only show when delivering) */}
      {showDeliveryTracking && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Live Tracking</h2>
            <DeliveryTracking orderId={orderId} />
          </div>
          
          <DriverInfo orderId={orderId} />
        </div>
      )}
    </div>
  );
}

export default OrderTrackingPage;