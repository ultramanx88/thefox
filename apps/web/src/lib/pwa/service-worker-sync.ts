/**
 * Service Worker Background Sync Integration
 * Integrates background sync with service worker for offline functionality
 */

import { BackgroundSyncManager } from './background-sync-manager';

declare const self: ServiceWorkerGlobalScope;

class ServiceWorkerSyncManager {
  private syncManager: BackgroundSyncManager;
  private registeredTags = new Set<string>();

  constructor() {
    this.syncManager = new BackgroundSyncManager({
      batchSize: 5, // Smaller batches in service worker
      processingInterval: 10000, // Less frequent processing
      maxRetries: 5,
      exponentialBackoff: true
    });

    this.setupEventListeners();
  }

  /**
   * Setup service worker event listeners
   */
  private setupEventListeners(): void {
    // Handle background sync events
    self.addEventListener('sync', (event) => {
      console.log('Background sync event received:', event.tag);
      
      if (event.tag === 'background-sync') {
        event.waitUntil(this.handleBackgroundSync());
      } else if (event.tag.startsWith('priority-sync-')) {
        const priority = event.tag.replace('priority-sync-', '') as 'critical' | 'high' | 'medium' | 'low';
        event.waitUntil(this.handlePrioritySync(priority));
      }
    });

    // Handle messages from main thread
    self.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_ACTION') {
        this.handleSyncMessage(event.data);
      }
    });

    // Handle fetch events for offline actions
    self.addEventListener('fetch', (event) => {
      if (this.shouldInterceptRequest(event.request)) {
        event.respondWith(this.handleOfflineRequest(event.request));
      }
    });
  }

  /**
   * Handle background sync event
   */
  private async handleBackgroundSync(): Promise<void> {
    try {
      console.log('Processing background sync...');
      
      // Process pending sync operations
      const status = this.syncManager.getQueueStatus();
      console.log(`Processing ${status.totalActions} pending actions`);
      
      // The sync manager will automatically process the queue
      // We just need to wait for it to complete
      await this.waitForSyncCompletion();
      
      console.log('Background sync completed successfully');
    } catch (error) {
      console.error('Background sync failed:', error);
      throw error; // This will cause the sync to be retried
    }
  }

  /**
   * Handle priority-specific sync
   */
  private async handlePrioritySync(priority: 'critical' | 'high' | 'medium' | 'low'): Promise<void> {
    try {
      console.log(`Processing ${priority} priority sync...`);
      
      // This would integrate with the priority processor
      // For now, just process all actions
      await this.handleBackgroundSync();
      
    } catch (error) {
      console.error(`${priority} priority sync failed:`, error);
      throw error;
    }
  }

  /**
   * Handle sync messages from main thread
   */
  private async handleSyncMessage(data: any): Promise<void> {
    try {
      switch (data.action) {
        case 'ADD_TO_QUEUE':
          await this.syncManager.addToQueue(data.payload);
          this.scheduleBackgroundSync(data.payload.priority);
          break;
          
        case 'GET_STATUS':
          const status = this.syncManager.getQueueStatus();
          // Send response back to main thread
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_STATUS_RESPONSE',
                payload: status
              });
            });
          });
          break;
          
        case 'CLEAR_QUEUE':
          await this.syncManager.clearQueue();
          break;
          
        default:
          console.warn('Unknown sync message action:', data.action);
      }
    } catch (error) {
      console.error('Error handling sync message:', error);
    }
  }

  /**
   * Schedule background sync with appropriate tag
   */
  private async scheduleBackgroundSync(priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    try {
      if ('serviceWorker' in self && 'sync' in self.registration) {
        let tag = 'background-sync';
        
        // Use priority-specific tags for high priority items
        if (priority === 'high') {
          tag = 'priority-sync-high';
        }
        
        if (!this.registeredTags.has(tag)) {
          await self.registration.sync.register(tag);
          this.registeredTags.add(tag);
          console.log(`Registered background sync with tag: ${tag}`);
        }
      }
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }

  /**
   * Check if request should be intercepted for offline handling
   */
  private shouldInterceptRequest(request: Request): boolean {
    // Intercept API requests that might need offline handling
    const url = new URL(request.url);
    
    // Check if it's an API request
    if (url.pathname.startsWith('/api/')) {
      // Only intercept POST, PUT, DELETE requests (mutations)
      return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
    }
    
    return false;
  }

  /**
   * Handle offline requests by queuing them for sync
   */
  private async handleOfflineRequest(request: Request): Promise<Response> {
    try {
      // Try to make the request first
      const response = await fetch(request);
      
      if (response.ok) {
        return response;
      }
      
      // If request failed, queue it for offline sync
      throw new Error(`Request failed with status: ${response.status}`);
      
    } catch (error) {
      // Network error or request failed - queue for offline sync
      console.log('Request failed, queuing for offline sync:', request.url);
      
      const action = await this.createActionFromRequest(request);
      await this.syncManager.addToQueue(action);
      
      // Schedule background sync
      await this.scheduleBackgroundSync(action.priority);
      
      // Return a response indicating the action was queued
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Action queued for sync when online',
          actionId: action.id
        }),
        {
          status: 202, // Accepted
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }

  /**
   * Create sync action from failed request
   */
  private async createActionFromRequest(request: Request): Promise<any> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    
    // Extract collection from URL path
    const collection = pathParts[2] || 'unknown'; // /api/[collection]/...
    
    // Determine action type from HTTP method
    let type: 'create' | 'update' | 'delete';
    switch (request.method) {
      case 'POST':
        type = 'create';
        break;
      case 'PUT':
      case 'PATCH':
        type = 'update';
        break;
      case 'DELETE':
        type = 'delete';
        break;
      default:
        type = 'create';
    }
    
    // Extract data from request body
    let data = {};
    try {
      if (request.body) {
        const clonedRequest = request.clone();
        data = await clonedRequest.json();
      }
    } catch (error) {
      console.warn('Failed to extract request body:', error);
    }
    
    // Determine priority based on collection
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (['orders', 'payments', 'user_sessions'].includes(collection)) {
      priority = 'high';
    } else if (['users', 'products'].includes(collection)) {
      priority = 'medium';
    } else {
      priority = 'low';
    }
    
    return {
      type,
      collection,
      data,
      priority,
      maxRetries: 3,
      originalUrl: request.url,
      originalMethod: request.method
    };
  }

  /**
   * Wait for sync completion (with timeout)
   */
  private async waitForSyncCompletion(timeoutMs: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const status = this.syncManager.getQueueStatus();
      
      if (status.totalActions === 0 && !status.processing) {
        return; // All done
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.warn('Sync completion timeout reached');
  }
}

// Initialize the service worker sync manager
let swSyncManager: ServiceWorkerSyncManager;

// Only initialize if we're in a service worker context
if (typeof self !== 'undefined' && 'serviceWorker' in self) {
  swSyncManager = new ServiceWorkerSyncManager();
}

export { ServiceWorkerSyncManager };