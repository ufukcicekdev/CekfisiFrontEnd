import { useEffect, useRef, useState, useCallback } from 'react';

interface User {
  id: number;
  email: string;
  user_type: string;
}

interface Message {
  id: number;
  content: string;
  sender: User;
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'message' | 'ping' | 'pong' | 'connection_established' | 'notification';
  data?: {
    id?: number;
    content?: string;
    sender?: {
      id: number;
      email: string;
      user_type: string;
    };
    timestamp?: string;
  };
}

interface WebSocketOptions {
  onMessage?: (data: WebSocketMessage) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  token: string;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export const useWebSocket = (roomId: string | null, options: WebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const pingTimeoutRef = useRef<NodeJS.Timeout>();
  const shouldReconnectRef = useRef(true);
  const isConnectingRef = useRef(false);

  const maxReconnectAttempts = options.reconnectAttempts || 5;
  const token = options.token;

  const cleanup = useCallback(() => {
    shouldReconnectRef.current = false;
    isConnectingRef.current = false;
    if (wsRef.current) {
      wsRef.current.close(1000, "Normal closure");
      wsRef.current = null;
    }
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (!roomId || !token) {
      return;
    }

    isConnectingRef.current = true;

    try {
      const wsUrl = `ws://localhost:8000/ws/chat/${roomId}/?token=${token}`;
      console.log('WebSocket bağlantısı başlatılıyor:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      shouldReconnectRef.current = true;

      let pingTimeout: NodeJS.Timeout;
      const resetPingTimeout = () => {
        if (pingTimeout) clearTimeout(pingTimeout);
        if (shouldReconnectRef.current) {
          pingTimeout = setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.close(4000, "Ping timeout");
            }
          }, 35000);
        }
      };

      ws.onopen = () => {
        console.log('WebSocket bağlantısı AÇILDI ✅');
        isConnectingRef.current = false;
        setIsConnected(true);
        reconnectCountRef.current = 0;
        resetPingTimeout();

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          resetPingTimeout();

          switch (data.type) {
            case 'pong':
              console.log('Pong alındı ✅');
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'ping' }));
                }
              }, 30000);
              break;
            case 'connection_established':
              console.log('Bağlantı başarılı ✅');
              break;
            case 'message':
              if (data.data) {
                options.onMessage?.(data);
              }
              break;
          }
        } catch (error) {
          console.error('Mesaj işleme hatası:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket kapandı:', event.code, event.reason);
        setIsConnected(false);
        isConnectingRef.current = false;
        clearTimeout(pingTimeout);

        if (shouldReconnectRef.current && event.code !== 1000 && reconnectCountRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 10000);
          console.log(`Yeniden bağlanılacak: ${delay}ms`);
          
          setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error: Event) => {
        console.error('WebSocket hatası:', error);
        isConnectingRef.current = false;
      };

    } catch (error) {
      console.error('Bağlantı hatası:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [roomId, token, maxReconnectAttempts, options.onMessage]);

  useEffect(() => {
    cleanup();
    shouldReconnectRef.current = true;
    reconnectCountRef.current = 0;
    connect();

    return () => {
      cleanup();
    };
  }, [roomId]);

  const sendMessage = useCallback((content: string): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket bağlı değil');
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type: 'message',
        data: {
          content: content
        }
      };
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      return false;
    }
  }, []);

  return {
    isConnected,
    sendMessage,
    reconnect: connect
  };
}; 