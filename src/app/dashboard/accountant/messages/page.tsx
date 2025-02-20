'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PageContainer } from '@/components/PageContainer'
import axios from '@/lib/axios'
import { useAuth } from '@/contexts/auth'
import { toast } from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'
import EmojiPicker from 'emoji-picker-react'
import { FaceSmileIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { EmojiClickData } from 'emoji-picker-react'
import { useWebSocket, WebSocketMessage } from '@/hooks/useWebSocket'
import { getAuthToken } from '@/utils/auth'
import { v4 as uuidv4 } from 'uuid'

interface User {
  id: number;
  email: string;
  user_type: string;
}

interface LastMessage {
  id: number;
  sender: User;
  content: string;
  timestamp: string;
}

interface Room {
  id: number;
  name: string;
  accountant: User;
  client: User;
  created_at: string;
  last_message: LastMessage | null;
}

interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    email: string;
    user_type: string;
  };
  timestamp: string;
}

export default function AccountantMessagesPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const roomId = searchParams?.get('room');
  const token = getAuthToken();
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const { isConnected, sendMessage } = useWebSocket(
    selectedRoom?.id.toString() || null,
    {
      token,
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'message' && data.data) {
          if (!data.data.id || !data.data.content || !data.data.sender || !data.data.timestamp) {
            console.error('Eksik mesaj verisi:', data);
            return;
          }

          const messageData: Message = {
            id: data.data.id,
            content: data.data.content,
            sender: {
              id: data.data.sender.id,
              email: data.data.sender.email,
              user_type: data.data.sender.user_type
            },
            timestamp: data.data.timestamp
          };

          setMessages(prev => {
            if (prev.some(msg => msg.id === messageData.id)) {
              return prev;
            }
            return [...prev, messageData];
          });
          
          setTimeout(scrollToBottom, 100);
          
          if (messageData.sender.id !== user?.id) {
            showNotification(messageData);
          }
        }
      }
    }
  );

  // Mesaj gönderme fonksiyonu
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !newMessage.trim()) return;

    const messageContent = newMessage.trim();
    console.log('Mesaj gönderme denemesi:', { content: messageContent, roomId: selectedRoom.id });

    try {
      if (isConnected) {
        console.log('WebSocket bağlantısı aktif, mesaj gönderiliyor...');
        const success = sendMessage(messageContent);
        
        if (success) {
          console.log('Mesaj başarıyla gönderildi');
          setNewMessage('');
          
          // Geçici mesaj ekle (optimistic update)
          const tempMessage: Message = {
            id: Date.now(), // Geçici ID
            content: messageContent,
            sender: {
              id: user!.id,
              email: user!.email,
              user_type: user!.user_type
            },
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, tempMessage]);
          scrollToBottom();
        } else {
          throw new Error('WebSocket mesajı gönderilemedi');
        }
      } else {
        // HTTP fallback
        console.log('WebSocket bağlantısı yok, HTTP kullanılıyor...');
        const response = await axios.post<Message>(
          `/api/v1/chat/rooms/${selectedRoom.id}/messages/`,
          { content: messageContent }
        );
        
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        scrollToBottom();
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast.error('Mesaj gönderilemedi');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showNotification = useCallback((message: Message) => {
    if (notificationPermission === 'granted' && document.hidden) {
      new Notification('Yeni Mesaj', {
        body: message.content,
        icon: '/logo.png'
      });
    }
  }, [notificationPermission]);

  // ... diğer fonksiyonlar ve JSX aynı ...
} 