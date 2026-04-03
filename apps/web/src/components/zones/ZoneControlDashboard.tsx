'use client';

import { useState, useEffect } from 'react';
import { MapPin, Clock, Users, AlertTriangle, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { ZoneManager } from '@/lib/zones/manager';

export default function ZoneControlDashboard() {
  const [zoneManager] = useState(new ZoneManager());
  const [zones, setZones] = useState(zoneManager.getAllZones());
  const [selectedZone, setSelectedZone] = useState(zones[0]);
  const [testLocation, setTestLocation] = useState({ lat: 42.3601, lng: -71.0589 });

  const toggleZoneStatus = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (zone) {
      const newStatus = !zone.active;
      zoneManager.toggleZoneStatus(zoneId, newStatus);
      setZones([...zoneManager.getAllZones()]);
    }
  };

  const getZoneTypeColor = (type: string) => {
    switch (type) {
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'standard': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'extended': return 'bg-green-100 text-green-800 border-green-200';
      case 'restricted': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCapacityStatus = (zone: any) => {
    const utilization = (zone.capacityLimits.currentLoad / zone.capacityLimits.maxOrdersPerHour) * 100;
    if (utilization >= 90) return { color: 'text-red-600', status: 'Critical' };
    if (utilization >= 70) return { color: 'text-yellow-600', status: 'High' };
    return { color: 'text-green-600', status: 'Normal' };
  };

  const testZoneAvailability = () => {
    const availability = zoneManager.checkZoneAvailability(
      testLocation,
      35.00,
      ['fresh', 'dry']
    );
    console.log('Zone availability:', availability);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Zone Control Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Active Zones: {zones.filter(z => z.active).length}/{zones.length}
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Add New Zone
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Zone List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Delivery Zones</h2>
            
            <div className="space-y-3">
              {zones.map((zone) => {
                const capacity = getCapacityStatus(zone);
                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedZone.id === zone.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{zone.name}</h3>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getZoneTypeColor(zone.type)}`}>
                          {zone.type}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleZoneStatus(zone.id);
                        }}
                        className="flex items-center"
                      >
                        {zone.active ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Radius: {zone.radius}km</div>
                      <div className={capacity.color}>Load: {capacity.status}</div>
                      <div>Min Order: ${zone.restrictions.minOrderValue}</div>
                      <div>Drivers: {zone.capacityLimits.maxDrivers}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Zone Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedZone && (
              <>
                {/* Zone Overview */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedZone.name}</h2>
                      <p className="text-gray-600">Zone ID: {selectedZone.id}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm border ${getZoneTypeColor(selectedZone.type)}`}>
                        {selectedZone.type}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        selectedZone.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedZone.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium">Coverage</span>
                      </div>
                      <p className="text-sm text-gray-600">Radius: {selectedZone.radius} km</p>
                      <p className="text-sm text-gray-600">
                        Center: {selectedZone.center.lat.toFixed(4)}, {selectedZone.center.lng.toFixed(4)}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Users className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium">Capacity</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Orders: {selectedZone.capacityLimits.currentLoad}/{selectedZone.capacityLimits.maxOrdersPerHour}/hr
                      </p>
                      <p className="text-sm text-gray-600">Drivers: {selectedZone.capacityLimits.maxDrivers}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="font-medium">Service Level</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Delivery: {selectedZone.serviceLevel.minDeliveryTime}-{selectedZone.serviceLevel.maxDeliveryTime}min
                      </p>
                      <p className="text-sm text-gray-600">
                        Guaranteed: {selectedZone.serviceLevel.guaranteedDelivery ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Time Restrictions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Time Restrictions
                  </h3>
                  
                  {selectedZone.timeRestrictions.enabled ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Operating Hours</h4>
                        <div className="space-y-2">
                          {selectedZone.timeRestrictions.allowedHours.map((schedule, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <span>
                                {schedule.days.map(day => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day]).join(', ')}
                              </span>
                              <span className="font-medium">
                                {schedule.start} - {schedule.end}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedZone.timeRestrictions.blackoutPeriods.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Blackout Periods</h4>
                          <div className="space-y-2">
                            {selectedZone.timeRestrictions.blackoutPeriods.map((blackout, index) => (
                              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-red-800">{blackout.reason}</span>
                                  <span className="text-sm text-red-600">
                                    {new Date(blackout.start).toLocaleString()} - {new Date(blackout.end).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">No time restrictions applied</p>
                  )}
                </div>

                {/* Order Restrictions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-green-600" />
                    Order Restrictions
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Order Limits</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Minimum Order:</span>
                          <span className="font-medium">${selectedZone.restrictions.minOrderValue}</span>
                        </div>
                        {selectedZone.restrictions.maxOrderValue && (
                          <div className="flex justify-between">
                            <span>Maximum Order:</span>
                            <span className="font-medium">${selectedZone.restrictions.maxOrderValue}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Special Handling:</span>
                          <span className="font-medium">
                            {selectedZone.restrictions.requiresSpecialHandling ? 'Required' : 'Not Required'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Food Types</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Allowed:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedZone.restrictions.allowedFoodTypes.map(type => (
                              <span key={type} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {selectedZone.restrictions.blockedFoodTypes.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600">Blocked:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedZone.restrictions.blockedFoodTypes.map(type => (
                                <span key={type} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zone Testing */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Test Zone Availability</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                      <input
                        type="number"
                        value={testLocation.lat}
                        onChange={(e) => setTestLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        step="0.0001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                      <input
                        type="number"
                        value={testLocation.lng}
                        onChange={(e) => setTestLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        step="0.0001"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={testZoneAvailability}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Test Availability
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}