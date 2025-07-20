import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <WifiOff className="mx-auto h-16 w-16 text-gray-400" />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            You're Offline
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            It looks like you've lost your internet connection. Don't worry, you can still browse some content that's been cached.
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                What you can do:
              </h2>
              
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Check your internet connection and try again
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Browse previously visited pages that are cached
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your cart and preferences are saved locally
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            theFOX works offline with cached content
          </p>
        </div>
      </div>
    </div>
  );
}