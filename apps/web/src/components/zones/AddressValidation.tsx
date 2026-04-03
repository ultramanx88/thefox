'use client';

import { useState } from 'react';
import { MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { ZoneManager } from '@/lib/zones/manager';

interface AddressValidationProps {
  onAddressValidated: (isValid: boolean, zoneInfo?: any) => void;
}

export default function AddressValidation({ onAddressValidated }: AddressValidationProps) {
  const [zoneManager] = useState(new ZoneManager());
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateAddress = async () => {
    if (!address.trim()) return;
    
    setIsValidating(true);
    
    // Mock geocoding - in real app, use Google Maps API or similar
    const mockCoordinates = {
      lat: 42.3601 + (Math.random() - 0.5) * 0.1,
      lng: -71.0589 + (Math.random() - 0.5) * 0.1
    };
    
    setCoordinates(mockCoordinates);
    
    // Check zone availability
    const availability = zoneManager.checkZoneAvailability(
      mockCoordinates,
      35.00, // Mock order value
      ['fresh', 'dry'] // Mock food types
    );
    
    const availableZones = availability.filter(zone => zone.available);
    const unavailableZones = availability.filter(zone => !zone.available);
    
    setValidationResult({
      coordinates: mockCoordinates,
      availableZones,
      unavailableZones,
      isDeliverable: availableZones.length > 0
    });
    
    onAddressValidated(availableZones.length > 0, {
      coordinates: mockCoordinates,
      availableZones
    });
    
    setIsValidating(false);
  };

  const getZoneInfo = (zoneId: string) => {
    return zoneManager.getZoneById(zoneId);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <MapPin className="h-5 w-5 mr-2 text-blue-600" />
        Delivery Address Validation
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Delivery Address
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street, Boston, MA"
              className="flex-1 px-3 py-2 border rounded-lg"
              onKeyPress={(e) => e.key === 'Enter' && validateAddress()}
            />
            <button
              onClick={validateAddress}
              disabled={isValidating || !address.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </button>
          </div>
        </div>

        {validationResult && (
          <div className="space-y-4">
            {/* Validation Status */}
            <div className={`p-4 rounded-lg border ${
              validationResult.isDeliverable 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center">
                {validationResult.isDeliverable ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className={`font-medium ${
                  validationResult.isDeliverable ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.isDeliverable 
                    ? 'Address is in our delivery area!' 
                    : 'Sorry, we don\'t deliver to this address yet'
                  }
                </span>
              </div>
              
              {coordinates && (
                <p className="text-sm text-gray-600 mt-1">
                  Location: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                </p>
              )}
            </div>

            {/* Available Zones */}
            {validationResult.availableZones.length > 0 && (
              <div>
                <h4 className="font-medium text-green-800 mb-2">Available Delivery Options</h4>
                <div className="space-y-2">
                  {validationResult.availableZones.map((zoneAvail: any) => {
                    const zone = getZoneInfo(zoneAvail.zoneId);
                    if (!zone) return null;
                    
                    return (
                      <div key={zone.id} className="p-3 bg-green-50 border border-green-200 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-green-900">{zone.name}</h5>
                            <p className="text-sm text-green-700">
                              Delivery: {zone.serviceLevel.minDeliveryTime}-{zone.serviceLevel.maxDeliveryTime} minutes
                            </p>
                            <p className="text-sm text-green-700">
                              Base rate: ${zone.pricing.baseRate} + ${zone.pricing.perKmRate}/km
                            </p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {zone.type}
                          </span>
                        </div>
                        
                        {zone.restrictions.minOrderValue > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            Minimum order: ${zone.restrictions.minOrderValue}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unavailable Zones */}
            {validationResult.unavailableZones.length > 0 && (
              <div>
                <h4 className="font-medium text-red-800 mb-2">Delivery Restrictions</h4>
                <div className="space-y-2">
                  {validationResult.unavailableZones.map((zoneAvail: any) => {
                    const zone = getZoneInfo(zoneAvail.zoneId);
                    if (!zone) return null;
                    
                    return (
                      <div key={zone.id} className="p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-red-900">{zone.name}</h5>
                            <p className="text-sm text-red-700">{zoneAvail.reason}</p>
                            {zoneAvail.nextAvailableTime && (
                              <p className="text-xs text-red-600 flex items-center mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                Next available: {new Date(zoneAvail.nextAvailableTime).toLocaleTimeString()}
                              </p>
                            )}
                            {zoneAvail.estimatedWaitTime && (
                              <p className="text-xs text-red-600">
                                Estimated wait: {zoneAvail.estimatedWaitTime} minutes
                              </p>
                            )}
                          </div>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            Unavailable
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suggestions for unavailable addresses */}
            {!validationResult.isDeliverable && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Alternative Options</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Check if you're within our extended delivery area (up to 30km)</li>
                  <li>• Consider pickup from our nearest location</li>
                  <li>• Join our waitlist for future expansion to your area</li>
                  <li>• Increase your order value to meet minimum requirements</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}