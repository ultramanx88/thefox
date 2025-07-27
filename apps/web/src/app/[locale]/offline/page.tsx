import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-orange-100 text-orange-600 rounded-full h-16 w-16 flex items-center justify-center mb-4">
            <WifiOff className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            You're Offline
          </CardTitle>
          <CardDescription className="text-gray-600">
            No internet connection detected. Don't worry, you can still browse cached content!
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Available Offline:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Previously viewed markets</li>
              <li>• Cached product listings</li>
              <li>• Your saved favorites</li>
              <li>• Order history</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </div>
          
          <div className="text-xs text-gray-500 mt-6">
            <p>This page works offline thanks to PWA technology.</p>
            <p>You'll automatically reconnect when internet is restored.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}