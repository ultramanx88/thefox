'use client';

import { useState } from 'react';
import { MapPin, Clock, Phone, Navigation, Star } from 'lucide-react';
import { StoreManager } from '@/lib/stores/manager';

export default function StoreLocator() {
  const [storeManager] = useState(new StoreManager());
  const [stores] = useState(storeManager.getActiveStores().filter(s => s.features.acceptsOnlineOrders));
  const [selectedStore, setSelectedStore] = useState(stores[0]);

  const isStoreOpen = (store: any) => {
    const now = new Date();
    const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = store.operatingHours[day];
    if (todayHours?.closed) return false;
    
    return currentTime >= todayHours?.open && currentTime <= todayHours?.close;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Our Stores</h1>
          <p className="text-gray-600">Locate the nearest TheFox store for pickup or delivery</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {stores.map((store) => {
              const isOpen = isStoreOpen(store);
              
              return (
                <div
                  key={store.id}
                  onClick={() => setSelectedStore(store)}
                  className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-colors ${
                    selectedStore.id === store.id ? 'border-2 border-blue-500' : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
                      <p className="text-gray-600">{store.location.address}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isOpen ? 'Open' : 'Closed'}
                      </span>
                      <div className="flex items-center mt-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">
                          {store.performance.averageRating}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {store.contact.phone}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {store.capacity.deliveryRadius}km delivery
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {store.features.hasDelivery && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        Delivery
                      </span>
                    )}
                    {store.features.hasPickup && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        Pickup
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            {selectedStore && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedStore.name}</h2>
                  <p className="text-gray-600">{selectedStore.location.address}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Operating Hours
                    </h3>
                    <div className="space-y-1">
                      {Object.entries(selectedStore.operatingHours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="capitalize font-medium">{day}</span>
                          <span className={hours.closed ? 'text-red-600' : 'text-gray-600'}>
                            {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => window.open(`https://maps.google.com/?q=${selectedStore.location.coordinates.lat},${selectedStore.location.coordinates.lng}`)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </button>
                    
                    <button
                      onClick={() => window.open(`tel:${selectedStore.contact.phone}`)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Store
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}