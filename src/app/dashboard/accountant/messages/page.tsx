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

interface WebSocketData {
  id: number;
  content: string;
  sender: {
    id: number;
    email: string;
    user_type: string;
  };
  timestamp: string;
  room_id: number;
}

interface WebSocketMessage {
  type: 'message' | 'connection_established' | 'ping' | 'pong';
  data: WebSocketData;
}

export default function AccountantMessagesPage() {
  // ... diğer state tanımlamaları aynı ...

  const { isConnected, sendMessage } = useWebSocket(
    selectedRoom?.id.toString() || null,
    {
      token,
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'message' && data.data) {
          const messageData: Message = {
            id: data.data.id,
            content: data.data.content,
            sender: data.data.sender,
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

  // ... diğer fonksiyonlar ve JSX aynı ...
} 