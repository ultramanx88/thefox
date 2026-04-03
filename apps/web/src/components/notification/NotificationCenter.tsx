'use client';

import { useState, useEffect } from 'react';
import { notificationManager } from '@/lib/notification/notification-manager';

export default function NotificationCenter() {
  const [userId] = useState('user_001');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'chat'>('notifications');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time notifications
    notificationManager.subscribe(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Simulate some initial data
    setTimeout(() => {
      // Create sample conversation
      const conv = notificationManager.createConversation('ORD001', [
        { id: 'user_001', name: 'ลูกค้า A', role: 'customer' },
        { id: 'driver_001', name: 'คนส่ง B', role: 'driver' },
        { id: 'store_001', name: 'ร้าน C', role: 'store' }
      ]);

      // Send sample notifications
      notificationManager.sendOrderStatusUpdate('ORD001', userId, 'confirmed');
      notificationManager.sendDriverJobAlert('driver_001', 'ORD001', 'ร้านวัตถุดิบ ABC');
      
      loadData();
    }, 1000);

    return () => {
      notificationManager.unsubscribe(userId);
    };
  }, [userId]);

  const loadData = () => {
    setNotifications(notificationManager.getNotifications(userId));
    setConversations(notificationManager.getConversations(userId));
    setUnreadCount(notificationManager.getUnreadCount(userId));
  };

  const loadMessages = (conversationId: string) => {
    const msgs = notificationManager.getMessages(conversationId);
    setMessages(msgs);
    notificationManager.markMessagesAsRead(conversationId, userId);
    loadData(); // Refresh unread counts
  };

  const sendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return;
    
    notificationManager.sendMessage(selectedConversation.id, userId, newMessage.trim());
    setNewMessage('');
    loadMessages(selectedConversation.id);
  };

  const markAsRead = (notificationId: string) => {
    notificationManager.markAsRead(notificationId);
    loadData();
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      order: '📦',
      delivery: '🚚',
      system: '⚙️',
      chat: '💬',
      promotion: '🎁'
    };
    return icons[type as keyof typeof icons] || '📢';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'เมื่อสักครู่';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชั่วโมงที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">การแจ้งเตือนและแชท</h2>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 py-3 px-4 text-center ${
            activeTab === 'notifications' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-600'
          }`}
        >
          การแจ้งเตือน ({notifications.filter(n => !n.isRead).length})
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 px-4 text-center ${
            activeTab === 'chat' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-600'
          }`}
        >
          แชท ({conversations.reduce((sum, c) => sum + (c.unreadCount[userId] || 0), 0)})
        </button>
      </div>

      {/* Content */}
      <div className="h-96 overflow-hidden">
        {activeTab === 'notifications' ? (
          <div className="h-full overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">🔔</div>
                  <p>ไม่มีการแจ้งเตือน</p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">{notification.title}</h3>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                          <div className="flex gap-1">
                            {notification.channels.map((channel: string) => (
                              <span key={channel} className="text-xs bg-gray-100 px-1 rounded">
                                {channel}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex">
            {/* Conversations List */}
            <div className="w-1/3 border-r">
              <div className="h-full overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">💬</div>
                      <p>ไม่มีการสนทนา</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map(conversation => (
                      <div
                        key={conversation.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          setSelectedConversation(conversation);
                          loadMessages(conversation.id);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">
                            Order #{conversation.orderId}
                          </h3>
                          {conversation.unreadCount[userId] > 0 && (
                            <span className="bg-red-500 text-white text-xs px-1 rounded-full">
                              {conversation.unreadCount[userId]}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {conversation.participants.map(p => p.name).join(', ')}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {conversation.lastMessage.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-3 border-b bg-gray-50">
                    <h3 className="font-medium">Order #{selectedConversation.orderId}</h3>
                    <p className="text-sm text-gray-600">
                      {selectedConversation.participants.map((p: any) => p.name).join(', ')}
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg ${
                            message.senderId === userId
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {message.senderId !== userId && (
                            <p className="text-xs font-medium mb-1">{message.senderName}</p>
                          )}
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="พิมพ์ข้อความ..."
                        className="flex-1 p-2 border rounded-lg text-sm"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                      >
                        ส่ง
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💬</div>
                    <p>เลือกการสนทนา</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}