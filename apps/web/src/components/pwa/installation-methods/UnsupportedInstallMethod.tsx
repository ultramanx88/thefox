'use client';

import { AlertCircle, Bookmark, Chrome, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnsupportedInstallMethodProps {
  onDismiss: () => void;
  onBookmark: () => void;
}

export function UnsupportedInstallMethod({ 
  onDismiss, 
  onBookmark 
}: UnsupportedInstallMethodProps) {
  const handleBookmark = () => {
    // Try to add bookmark programmatically (limited browser support)
    try {
      if ((window as any).sidebar && (window as any).sidebar.addPanel) {
        // Firefox
        (window as any).sidebar.addPanel(document.title, window.location.href, '');
      } else if ((window as any).external && (window as any).external.AddFavorite) {
        // Internet Explorer
        (window as any).external.AddFavorite(window.location.href, document.title);
      } else {
        // Fallback: show instructions
        alert('Please bookmark this page manually using Ctrl+D (Cmd+D on Mac)');
      }
    } catch (error) {
      console.error('Bookmark failed:', error);
      alert('Please bookmark this page manually using Ctrl+D (Cmd+D on Mac)');
    }
    
    onBookmark();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <AlertCircle className="h-6 w-6 text-amber-500" />
        <div>
          <h3 className="font-medium">Browser Not Supported</h3>
          <p className="text-sm text-muted-foreground">
            Your browser doesn't support PWA installation
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start space-x-3">
            <Chrome className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                Recommended Browsers
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                For the best experience, use Chrome, Edge, or Safari which support PWA installation.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Alternative Options:</h4>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleBookmark}
              className="w-full justify-start"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmark This Page
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open('https://www.google.com/chrome/', '_blank')}
              className="w-full justify-start"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Download Chrome Browser
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• You can still use theFOX in your browser</p>
          <p>• Bookmark for quick access</p>
          <p>• Consider switching to a supported browser for the full app experience</p>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={onDismiss}
          className="flex-1"
        >
          Continue in Browser
        </Button>
      </div>
    </div>
  );
}