import React, { useState, useRef, useEffect, useCallback } from 'react';

// WebSocket URL'ini tanımlayalım
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.example.com/ws';

// Backend ile uyumlu mesaj tipleri
export interface WebSocketMessage {
  type: 'message' | 'connection_established' | 'ping' | 'pong' | 'notification';
  data: {
    id: number;
    content: string;
    sender: {
      id: number;
      email: string;
      user_type: string;
    };
    timestamp: string;
    room_id: number;
  };
}

interface WebSocketOptions {
  token: string;
  onMessage: (data: WebSocketMessage) => void;
}

// Sabitleri tanımlayalım
const MAX_RETRY_ATTEMPTS = 3;
const MAX_RETRY_DELAY = 15000;
const CONNECTION_TIMEOUT = 10000;

export const useWebSocket = (roomId: string | null, options: WebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);

  const connectWebSocket = useCallback(() => {
    if (!roomId || !options.token) {
      console.warn('WebSocket bağlantısı için gerekli bilgiler eksik:', { roomId, hasToken: !!options.token });
      return null;
    }

    try {
      // WebSocket URL'ini oluştur
      const wsUrl = new URL(`${WS_URL}/chat/${roomId}`);
      wsUrl.searchParams.append('token', options.token);
      
      console.log('WebSocket bağlantı denemesi:', wsUrl.toString().replace(options.token, '***'));

      const ws = new WebSocket(wsUrl.toString());

      ws.onopen = () => {
        console.log('WebSocket bağlantısı başarılı. Room:', roomId);
        setIsConnected(true);
        retryCount.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket mesajı alındı:', data);
          options.onMessage(data as WebSocketMessage);
        } catch (error) {
          console.error('WebSocket mesajı işlenirken hata:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket bağlantısı kapandı:', { code: event.code, reason: event.reason });
        setIsConnected(false);
        
        // Bağlantı beklenmedik şekilde kapandıysa yeniden bağlan
        if (event.code !== 1000 && event.code !== 1001 && retryCount.current < MAX_RETRY_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, retryCount.current), MAX_RETRY_DELAY);
          retryCount.current += 1;
          setTimeout(connectWebSocket, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket hatası:', error);
      };

      return ws;
    } catch (error) {
      console.error('WebSocket bağlantısı oluşturulurken hata:', error);
      return null;
    }
  }, [roomId, options]);

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !roomId) {
      console.error('WebSocket bağlantısı açık değil veya room ID eksik:', {
        readyState: wsRef.current?.readyState,
        roomId,
        isConnected
      });
      return false;
    }

    try {
      const messageData = {
        type: 'message',
        data: {
          content: content,
          room_id: parseInt(roomId)
        }
      };

      console.log('Gönderilecek mesaj:', messageData);
      wsRef.current.send(JSON.stringify(messageData));
      return true;
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      return false;
    }
  }, [roomId, isConnected]);

  useEffect(() => {
    console.log('WebSocket bağlantısı başlatılıyor...', { roomId });
    const ws = connectWebSocket();
    if (ws) {
      wsRef.current = ws;
    }

    return () => {
      if (wsRef.current) {
        console.log('WebSocket bağlantısı kapatılıyor...');
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  return {
    isConnected,
    sendMessage
  };
}; 