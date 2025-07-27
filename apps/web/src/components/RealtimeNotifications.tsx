/**
 * Real-time Notifications Components
 * Components for displaying and managing real-time notifications
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  X, 
  Check, 
  Package, 
  Truck, 
  AlertCircle, 
  Info,
  Gift,
  Settings,
  Trash2,
  MarkAsRead
} from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtime';

// ===========================================
// NOTIFICATION ITEM
// ===========================================

interface NotificationItemProps {
  notification: any;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  className = '' 
}: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="h-5 w-5 text-blue-500" />;
      case 'delivery': return <Truck className="h-5 w-5 text-green-500" />;
      case 'system': return <Info className="h-5 w-5 text-gray-500" />;
      case 'promotion': return <Gift className="h-5 w-5 text-purple-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const notificationTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className={`
      flex items-start space-x-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors
      ${!notification.isRead ? 'bg-blue-50' : ''}
      ${className}
    `}>
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className={`
              text-sm font-medium text-gray-900 
              ${!notification.isRead ? 'font-semibold' : ''}
            `}>
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {getTimeAgo(notification.createdAt)}
            </p>
          </div>

          {/* Unread indicator */}
          {!notification.isRead && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 mt-3">
          {!notification.isRead && onMarkAsRead && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Check className="h-3 w-3" />
              <span>Mark as read</span>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(notification.id)}
              className="text-xs text-red-600 hover:text-red-800 flex items-center space-x-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// NOTIFICATION LIST
// ===========================================

interface NotificationListProps {
  userId: string;
  unreadOnly?: boolean;
  className?: string;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

export function NotificationList({ 
  userId, 
  unreadOnly = false, 
  className = '',
  onMarkAsRead,
  onDelete,
  onMarkAllAsRead
}: NotificationListProps) {
  const { data: notifications, loading, error } = useRealtimeNotifications(userId, unreadOnly);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start space-x-3 p-4">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 text-red-600 ${className}`}>
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Failed to load notifications</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Bell className="h-8 w-8 mx-auto mb-2" />
        <p>No notifications yet</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`
                px-3 py-1 text-sm rounded-md transition-colors
                ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`
                px-3 py-1 text-sm rounded-md transition-colors
                ${filter === 'unread' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              Unread
            </button>
          </div>

          {/* Mark all as read */}
          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <MarkAsRead className="h-4 w-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BellOff className="h-8 w-8 mx-auto mb-2" />
            <p>No {filter} notifications</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ===========================================
// NOTIFICATION BELL ICON
// ===========================================

interface NotificationBellProps {
  userId: string;
  className?: string;
  onClick?: () => void;
}

export function NotificationBell({ userId, className = '', onClick }: NotificationBellProps) {
  const { data: notifications } = useRealtimeNotifications(userId, true); // unread only
  const unreadCount = notifications.length;

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
    >
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// ===========================================
// NOTIFICATION DROPDOWN
// ===========================================

interface NotificationDropdownProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function NotificationDropdown({ 
  userId, 
  isOpen, 
  onClose, 
  className = '' 
}: NotificationDropdownProps) {
  const { data: notifications } = useRealtimeNotifications(userId, false);
  const recentNotifications = notifications.slice(0, 5);

  if (!isOpen) return null;

  return (
    <div className={`
      absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Notifications</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Recent notifications */}
      <div className="max-h-64 overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2" />
            <p>No notifications</p>
          </div>
        ) : (
          recentNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              className="border-b-0"
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 5 && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}

// ===========================================
// NOTIFICATION TOAST
// ===========================================

interface NotificationToastProps {
  notification: any;
  onClose: () => void;
  onAction?: () => void;
  className?: string;
}

export function NotificationToast({ 
  notification, 
  onClose, 
  onAction, 
  className = '' 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="h-5 w-5 text-blue-500" />;
      case 'delivery': return <Truck className="h-5 w-5 text-green-500" />;
      case 'system': return <Info className="h-5 w-5 text-gray-500" />;
      case 'promotion': return <Gift className="h-5 w-5 text-purple-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg
      transform transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${className}
    `}>
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
            
            {onAction && (
              <button
                onClick={onAction}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2"
              >
                View Details
              </button>
            )}
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// NOTIFICATION SETTINGS
// ===========================================

interface NotificationSettingsProps {
  userId: string;
  className?: string;
}

export function NotificationSettings({ userId, className = '' }: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    push: true,
    email: false,
    sms: false,
    orderUpdates: true,
    deliveryUpdates: true,
    promotions: false,
    systemUpdates: true,
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // In a real app, you would save these settings to the backend
  };

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Delivery Methods */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Delivery Methods</h3>
          <div className="space-y-3">
            {[
              { key: 'push', label: 'Push Notifications', description: 'Receive notifications in your browser' },
              { key: 'email', label: 'Email', description: 'Receive notifications via email' },
              { key: 'sms', label: 'SMS', description: 'Receive notifications via text message' },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{label}</div>
                  <div className="text-sm text-gray-500">{description}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[key as keyof typeof settings] as boolean}
                    onChange={(e) => handleSettingChange(key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Notification Types</h3>
          <div className="space-y-3">
            {[
              { key: 'orderUpdates', label: 'Order Updates', description: 'Status changes for your orders' },
              { key: 'deliveryUpdates', label: 'Delivery Updates', description: 'Live tracking and delivery notifications' },
              { key: 'promotions', label: 'Promotions', description: 'Special offers and discounts' },
              { key: 'systemUpdates', label: 'System Updates', description: 'App updates and maintenance notices' },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{label}</div>
                  <div className="text-sm text-gray-500">{description}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[key as keyof typeof settings] as boolean}
                    onChange={(e) => handleSettingChange(key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationList;