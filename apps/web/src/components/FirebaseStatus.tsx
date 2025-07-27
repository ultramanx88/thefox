import React from 'react';
import { useFirebase } from '@/hooks/useFirebase';

interface ServiceStatusProps {
  name: string;
  isAvailable: boolean;
  isLoading: boolean;
}

function ServiceStatus({ name, isAvailable, isLoading }: ServiceStatusProps) {
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600">{name}</span>
        <span className="text-xs text-yellow-600">Checking...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-red-400'}`}></div>
      <span className="text-sm text-gray-700">{name}</span>
      <span className={`text-xs ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
        {isAvailable ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}

interface FirebaseStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function FirebaseStatus({ className = '', showDetails = false }: FirebaseStatusProps) {
  const firebase = useFirebase();

  if (firebase.isLoading) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-yellow-800">Initializing Firebase...</span>
        </div>
      </div>
    );
  }

  if (!firebase.success) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-400 rounded-full"></div>
            <span className="text-sm font-medium text-red-800">Firebase Connection Failed</span>
          </div>
          <button
            onClick={firebase.retry}
            className="text-xs text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
        {showDetails && firebase.errors.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-red-600 mb-1">Errors:</p>
            <ul className="text-xs text-red-600 space-y-1">
              {firebase.errors.map((error, index) => (
                <li key={index} className="ml-2">• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-4 h-4 bg-green-400 rounded-full"></div>
        <span className="text-sm font-medium text-green-800">Firebase Connected</span>
        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
          {firebase.environment}
        </span>
      </div>
      
      {showDetails && (
        <div className="space-y-2">
          <ServiceStatus 
            name="Authentication" 
            isAvailable={firebase.services.auth} 
            isLoading={firebase.isLoading}
          />
          <ServiceStatus 
            name="Firestore" 
            isAvailable={firebase.services.firestore} 
            isLoading={firebase.isLoading}
          />
          <ServiceStatus 
            name="Storage" 
            isAvailable={firebase.services.storage} 
            isLoading={firebase.isLoading}
          />
          <ServiceStatus 
            name="Functions" 
            isAvailable={firebase.services.functions} 
            isLoading={firebase.isLoading}
          />
          {firebase.services.analytics && (
            <ServiceStatus 
              name="Analytics" 
              isAvailable={firebase.services.analytics} 
              isLoading={firebase.isLoading}
            />
          )}
          {firebase.services.messaging && (
            <ServiceStatus 
              name="Messaging" 
              isAvailable={firebase.services.messaging} 
              isLoading={firebase.isLoading}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default FirebaseStatus;