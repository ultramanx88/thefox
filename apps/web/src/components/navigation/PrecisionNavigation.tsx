'use client';

import { useState, useEffect, useRef } from 'react';
import { Navigation, MapPin, Compass, Zap, AlertTriangle, Target } from 'lucide-react';

interface GPSCoordinate {
  lat: number;
  lng: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

interface NavigationWaypoint {
  id: string;
  name: string;
  coordinates: GPSCoordinate;
  type: 'pickup' | 'delivery' | 'waypoint';
  address: string;
  instructions?: string;
  eta?: string;
  completed: boolean;
}

export default function PrecisionNavigation() {
  const [currentLocation, setCurrentLocation] = useState<GPSCoordinate | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low'>('medium');
  const [heading, setHeading] = useState(0);
  const [speed, setSpeed] = useState(0);
  const watchIdRef = useRef<number | null>(null);

  const [waypoints] = useState<NavigationWaypoint[]>([
    {
      id: '1',
      name: 'Pickup - TheFox Warehouse',
      coordinates: { lat: 42.3601, lng: -71.0589, accuracy: 3, timestamp: Date.now() },
      type: 'pickup',
      address: '100 Warehouse St, Boston, MA',
      instructions: 'Loading dock B, use service entrance',
      completed: true
    },
    {
      id: '2',
      name: 'Delivery - Sarah Johnson',
      coordinates: { lat: 42.3584, lng: -71.0598, accuracy: 2, timestamp: Date.now() },
      type: 'delivery',
      address: '456 Oak Street, Boston, MA',
      instructions: 'Ring doorbell twice, leave at door if no answer',
      eta: '2:15 PM',
      completed: false
    },
    {
      id: '3',
      name: 'Delivery - Mike Chen',
      coordinates: { lat: 42.3505, lng: -71.0495, accuracy: 2, timestamp: Date.now() },
      type: 'delivery',
      address: '789 Pine Avenue, Boston, MA',
      instructions: 'Apartment 3B, call when arrived',
      eta: '2:45 PM',
      completed: false
    }
  ]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: GPSCoordinate = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp
        };

        setCurrentLocation(coords);
        setSpeed(coords.speed || 0);
        setHeading(coords.heading || 0);
        
        // Determine accuracy level
        if (coords.accuracy <= 5) setAccuracy('high');
        else if (coords.accuracy <= 15) setAccuracy('medium');
        else setAccuracy('low');
      },
      (error) => {
        console.error('GPS Error:', error);
      },
      options
    );

    watchIdRef.current = watchId;
    setIsTracking(true);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const calculateDistance = (coord1: GPSCoordinate, coord2: GPSCoordinate): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1.lat * Math.PI/180;
    const φ2 = coord2.lat * Math.PI/180;
    const Δφ = (coord2.lat-coord1.lat) * Math.PI/180;
    const Δλ = (coord2.lng-coord1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const calculateBearing = (coord1: GPSCoordinate, coord2: GPSCoordinate): number => {
    const φ1 = coord1.lat * Math.PI/180;
    const φ2 = coord2.lat * Math.PI/180;
    const Δλ = (coord2.lng-coord1.lng) * Math.PI/180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1)*Math.sin(φ2) - Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (θ*180/Math.PI + 360) % 360; // Bearing in degrees
  };

  const getAccuracyColor = (acc: string) => {
    switch (acc) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const nextWaypoint = waypoints.find(w => !w.completed);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center">
              <Navigation className="h-6 w-6 mr-2 text-blue-400" />
              Precision Navigation
            </h1>
            <button
              onClick={isTracking ? stopTracking : startTracking}
              className={`px-6 py-2 rounded-lg font-medium ${
                isTracking 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GPS Status */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-400" />
              GPS Status
            </h2>

            {currentLocation ? (
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">Accuracy</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccuracyColor(accuracy)}`}>
                      {accuracy.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    ±{currentLocation.accuracy.toFixed(1)}m
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-300">Latitude</p>
                    <p className="font-mono text-sm">{currentLocation.lat.toFixed(6)}</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-300">Longitude</p>
                    <p className="font-mono text-sm">{currentLocation.lng.toFixed(6)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Compass className="h-4 w-4 mr-1 text-blue-400" />
                      <p className="text-xs text-gray-300">Heading</p>
                    </div>
                    <p className="font-bold">{heading.toFixed(0)}°</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Zap className="h-4 w-4 mr-1 text-yellow-400" />
                      <p className="text-xs text-gray-300">Speed</p>
                    </div>
                    <p className="font-bold">{(speed * 3.6).toFixed(1)} km/h</p>
                  </div>
                </div>

                {currentLocation.altitude && (
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-300">Altitude</p>
                    <p className="font-bold">{currentLocation.altitude.toFixed(1)}m</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">GPS not active</p>
                <p className="text-sm text-gray-500">Start tracking to see location data</p>
              </div>
            )}
          </div>

          {/* Navigation Instructions */}
          <div className="lg:col-span-2 space-y-4">
            {nextWaypoint && currentLocation && (
              <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-blue-100">Next Destination</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-blue-100">{nextWaypoint.name}</h3>
                    <p className="text-sm text-blue-200">{nextWaypoint.address}</p>
                    {nextWaypoint.instructions && (
                      <p className="text-sm text-blue-300 mt-2">
                        📝 {nextWaypoint.instructions}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="bg-blue-800 p-3 rounded">
                      <p className="text-xs text-blue-200">Distance</p>
                      <p className="text-xl font-bold text-blue-100">
                        {(calculateDistance(currentLocation, nextWaypoint.coordinates) / 1000).toFixed(2)} km
                      </p>
                    </div>
                    
                    <div className="bg-blue-800 p-3 rounded">
                      <p className="text-xs text-blue-200">Bearing</p>
                      <p className="text-xl font-bold text-blue-100">
                        {calculateBearing(currentLocation, nextWaypoint.coordinates).toFixed(0)}°
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => window.open(`https://maps.google.com/?q=${nextWaypoint.coordinates.lat},${nextWaypoint.coordinates.lng}`)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Open in Maps
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg">
                    Mark as Arrived
                  </button>
                </div>
              </div>
            )}

            {/* All Waypoints */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Route Waypoints</h2>
              
              <div className="space-y-3">
                {waypoints.map((waypoint, index) => {
                  const distance = currentLocation 
                    ? calculateDistance(currentLocation, waypoint.coordinates) / 1000
                    : 0;
                  
                  return (
                    <div 
                      key={waypoint.id} 
                      className={`p-4 rounded-lg border ${
                        waypoint.completed 
                          ? 'bg-green-900 border-green-700' 
                          : waypoint === nextWaypoint
                          ? 'bg-blue-900 border-blue-700'
                          : 'bg-gray-700 border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <h3 className="font-medium">{waypoint.name}</h3>
                            {waypoint.completed && (
                              <span className="text-green-400 text-xs">✓ Completed</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300">{waypoint.address}</p>
                          {waypoint.eta && (
                            <p className="text-xs text-gray-400">ETA: {waypoint.eta}</p>
                          )}
                        </div>
                        
                        {currentLocation && (
                          <div className="text-right">
                            <p className="text-sm font-medium">{distance.toFixed(2)} km</p>
                            <p className="text-xs text-gray-400">
                              ±{waypoint.coordinates.accuracy}m accuracy
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Precision Alerts */}
        {accuracy === 'low' && (
          <div className="mt-6 bg-red-900 border border-red-700 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <div>
                <h3 className="font-medium text-red-100">Low GPS Accuracy Warning</h3>
                <p className="text-sm text-red-200">
                  GPS accuracy is currently low (±{currentLocation?.accuracy.toFixed(1)}m). 
                  Consider moving to an open area for better signal.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}