interface Notification {
  id: string;
  type: 'order' | 'delivery' | 'system' | 'chat' | 'promotion';
  title: string;
  message: string;
  recipient: string;
  sender?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: ('push' | 'sms' | 'email' | 'line')[];
  data?: any;
  isRead: boolean;
  createdAt: string;
  scheduledAt?: string;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'driver' | 'store' | 'admin';
  message: string;
  messageType: 'text' | 'image' | 'location' | 'system';
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  orderId?: string;
  participants: Array<{
    id: string;
    name: string;
    role: 'customer' | 'driver' | 'store' | 'admin';
    isOnline: boolean;
  }>;
  lastMessage?: ChatMessage;
  unreadCount: Record<string, number>;
  createdAt: string;
}

export class NotificationManager {
  private notifications: Notification[] = [];
  private conversations: Conversation[] = [];
  private messages: ChatMessage[] = [];
  private subscribers: Record<string, (notification: Notification) => void> = {};

  // Notification Management
  sendNotification(notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    this.notifications.push(newNotification);
    
    if (notification.scheduledAt) {
      this.scheduleNotification(newNotification);
    } else {
      this.deliverNotification(newNotification);
    }

    return newNotification;
  }

  private scheduleNotification(notification: Notification) {
    const scheduleTime = new Date(notification.scheduledAt!);
    const now = new Date();
    const delay = scheduleTime.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(() => {
        this.deliverNotification(notification);
      }, delay);
    } else {
      this.deliverNotification(notification);
    }
  }

  private deliverNotification(notification: Notification) {
    // Simulate different delivery channels
    notification.channels.forEach(channel => {
      switch (channel) {
        case 'push':
          this.sendPushNotification(notification);
          break;
        case 'sms':
          this.sendSMS(notification);
          break;
        case 'email':
          this.sendEmail(notification);
          break;
        case 'line':
          this.sendLineMessage(notification);
          break;
      }
    });

    // Notify subscribers (real-time updates)
    const subscriber = this.subscribers[notification.recipient];
    if (subscriber) {
      subscriber(notification);
    }
  }

  private sendPushNotification(notification: Notification) {
    console.log(`📱 Push: ${notification.title} to ${notification.recipient}`);
    // Integration with Firebase Cloud Messaging or similar
  }

  private sendSMS(notification: Notification) {
    console.log(`📱 SMS: ${notification.message} to ${notification.recipient}`);
    // Integration with SMS gateway
  }

  private sendEmail(notification: Notification) {
    console.log(`📧 Email: ${notification.title} to ${notification.recipient}`);
    // Integration with email service
  }

  private sendLineMessage(notification: Notification) {
    console.log(`💬 Line: ${notification.message} to ${notification.recipient}`);
    // Integration with Line Messaging API
  }

  // Chat Management
  createConversation(orderId: string, participants: Array<{id: string, name: string, role: any}>) {
    const conversation: Conversation = {
      id: `conv_${Date.now()}`,
      orderId,
      participants: participants.map(p => ({...p, isOnline: false})),
      unreadCount: participants.reduce((acc, p) => ({...acc, [p.id]: 0}), {}),
      createdAt: new Date().toISOString()
    };

    this.conversations.push(conversation);
    return conversation;
  }

  sendMessage(conversationId: string, senderId: string, message: string, messageType: 'text' | 'image' | 'location' = 'text') {
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (!conversation) return null;

    const sender = conversation.participants.find(p => p.id === senderId);
    if (!sender) return null;

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId,
      senderName: sender.name,
      senderRole: sender.role,
      message,
      messageType,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    this.messages.push(chatMessage);
    conversation.lastMessage = chatMessage;

    // Update unread count for other participants
    conversation.participants.forEach(participant => {
      if (participant.id !== senderId) {
        conversation.unreadCount[participant.id]++;
      }
    });

    // Send notification to other participants
    conversation.participants.forEach(participant => {
      if (participant.id !== senderId) {
        this.sendNotification({
          type: 'chat',
          title: `ข้อความใหม่จาก ${sender.name}`,
          message: message.length > 50 ? message.substring(0, 50) + '...' : message,
          recipient: participant.id,
          sender: senderId,
          priority: 'medium',
          channels: ['push'],
          data: { conversationId, messageId: chatMessage.id }
        });
      }
    });

    return chatMessage;
  }

  markMessagesAsRead(conversationId: string, userId: string) {
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.unreadCount[userId] = 0;
    }

    this.messages
      .filter(m => m.conversationId === conversationId && m.senderId !== userId)
      .forEach(m => m.isRead = true);
  }

  // Quick Notification Templates
  sendOrderStatusUpdate(orderId: string, customerId: string, status: string, estimatedTime?: string) {
    const messages = {
      confirmed: 'ร้านค้ายืนยันคำสั่งซื้อแล้ว',
      preparing: 'ร้านค้ากำลังเตรียมสินค้า',
      ready: 'สินค้าพร้อมส่ง',
      picked_up: 'คนส่งรับสินค้าแล้ว กำลังเดินทางไปส่ง',
      delivered: 'ส่งสินค้าเรียบร้อยแล้ว'
    };

    let message = messages[status as keyof typeof messages] || `สถานะ: ${status}`;
    if (estimatedTime) {
      message += ` (เวลาโดยประมาณ: ${estimatedTime})`;
    }

    return this.sendNotification({
      type: 'order',
      title: `อัปเดตคำสั่งซื้อ #${orderId}`,
      message,
      recipient: customerId,
      priority: 'medium',
      channels: ['push', 'line'],
      data: { orderId, status }
    });
  }

  sendDriverJobAlert(driverId: string, orderId: string, pickupAddress: string) {
    return this.sendNotification({
      type: 'delivery',
      title: 'งานใหม่!',
      message: `รับสินค้าที่: ${pickupAddress}`,
      recipient: driverId,
      priority: 'high',
      channels: ['push', 'sms'],
      data: { orderId, action: 'new_job' }
    });
  }

  sendDeliveryReminder(customerId: string, orderId: string, estimatedTime: string) {
    return this.sendNotification({
      type: 'delivery',
      title: 'คนส่งกำลังมาส่งของ',
      message: `คาดว่าจะถึงในอีก ${estimatedTime} นาที`,
      recipient: customerId,
      priority: 'high',
      channels: ['push', 'sms'],
      data: { orderId },
      scheduledAt: new Date(Date.now() + 30 * 60000).toISOString() // 30 minutes from now
    });
  }

  // Getters
  getNotifications(userId: string, limit: number = 20): Notification[] {
    return this.notifications
      .filter(n => n.recipient === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  getUnreadCount(userId: string): number {
    return this.notifications.filter(n => n.recipient === userId && !n.isRead).length;
  }

  getConversations(userId: string): Conversation[] {
    return this.conversations
      .filter(c => c.participants.some(p => p.id === userId))
      .sort((a, b) => {
        const aTime = a.lastMessage?.timestamp || a.createdAt;
        const bTime = b.lastMessage?.timestamp || b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
  }

  getMessages(conversationId: string, limit: number = 50): ChatMessage[] {
    return this.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  subscribe(userId: string, callback: (notification: Notification) => void) {
    this.subscribers[userId] = callback;
  }

  unsubscribe(userId: string) {
    delete this.subscribers[userId];
  }
}

export const notificationManager = new NotificationManager();