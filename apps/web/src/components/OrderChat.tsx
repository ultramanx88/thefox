'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Paperclip, Send } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from './ui/scroll-area';

type Message = {
  id: number;
  sender: {
    name: string;
    role: 'customer' | 'vendor' | 'driver';
    avatar: string;
  };
  content: {
    text?: string;
    image?: string;
    imageHint?: string;
  };
  timestamp: string;
};

const mockMessages: Message[] = [
  {
    id: 1,
    sender: { name: 'คุณ', role: 'customer', avatar: 'https://placehold.co/100x100.png' },
    content: { text: 'ขอต้นหอมเพิ่มหน่อยได้ไหมคะ' },
    timestamp: '10:30 AM',
  },
  {
    id: 2,
    sender: { name: 'ร้านผักป้านี', role: 'vendor', avatar: 'https://placehold.co/100x100.png' },
    content: { text: 'ได้เลยค่ะ เดี๋ยวเพิ่มไปให้ในออเดอร์นะคะ' },
    timestamp: '10:31 AM',
  },
  {
    id: 3,
    sender: { name: 'สมชาย ใจดี', role: 'driver', avatar: 'https://placehold.co/100x100.png' },
    content: { text: 'ผมเข้ารับของที่ร้านแล้วนะครับ กำลังจะออกเดินทาง' },
    timestamp: '10:45 AM',
  },
   {
    id: 4,
    sender: { name: 'คุณ', role: 'customer', avatar: 'https://placehold.co/100x100.png' },
    content: { image: 'https://placehold.co/300x200.png', imageHint: 'building entrance' },
    timestamp: '10:46 AM',
  },
  {
    id: 5,
    sender: { name: 'คุณ', role: 'customer', avatar: 'https://placehold.co/100x100.png' },
    content: { text: 'ถึงแล้วรบกวนเข้าประตูนี้ได้เลยค่ะ' },
    timestamp: '10:46 AM',
  },
];

export function OrderChat() {
  const t = useTranslations('OrderChat');
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    const newMsg: Message = {
      id: messages.length + 1,
      sender: { name: t('currentUser'), role: 'customer', avatar: 'https://placehold.co/100x100.png' },
      content: { text: newMessage },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const getRoleTranslation = (role: 'customer' | 'vendor' | 'driver') => {
      return t(`roles.${role}` as any);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[500px]">
        <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-6">
            {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={msg.sender.avatar} />
                    <AvatarFallback>{msg.sender.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                        <p className="font-semibold">{msg.sender.name}</p>
                        <p className="text-xs text-muted-foreground">{getRoleTranslation(msg.sender.role)}</p>
                        <p className="text-xs text-muted-foreground ml-auto">{msg.timestamp}</p>
                    </div>
                    <div className="mt-1 text-sm text-foreground bg-muted p-3 rounded-lg inline-block max-w-full">
                    {msg.content.text && <p>{msg.content.text}</p>}
                    {msg.content.image && (
                        <div className="space-y-2">
                             <Image
                                src={msg.content.image}
                                alt={t('imageMessage')}
                                data-ai-hint={msg.content.imageHint}
                                width={200}
                                height={150}
                                className="rounded-md"
                            />
                            <p className="text-xs text-muted-foreground italic">{t('imageMessage')}</p>
                        </div>
                    )}
                    </div>
                </div>
                </div>
            ))}
            </div>
        </ScrollArea>
        <div className="flex items-center gap-2 pt-4 border-t">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                }
            }}
            placeholder={t('inputPlaceholder')}
            className="flex-1"
          />
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">{t('attachButton')}</span>
          </Button>
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
            <span className="sr-only">{t('sendButton')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
