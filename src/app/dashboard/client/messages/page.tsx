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

// Interface'leri ekleyelim
interface User {
  id: number
  email: string
  user_type: string
  first_name: string
  last_name: string
}

interface LastMessage {
  id: number
  sender: User
  content: string
  timestamp: string
}

interface Room {
  id: number
  name: string
  accountant: User
  client: User
  created_at: string
  last_message: LastMessage | null
}

interface Message {
  id: number
  content: string
  sender: {
    id: number
    email: string
    user_type: string
  }
  timestamp: string
}

export default function ClientMessagesPage() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const roomId = searchParams?.get('room')
  const token = getAuthToken()
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const { isConnected, sendMessage } = useWebSocket(
    selectedRoom?.id.toString() || null,
    {
      token,
      onMessage: (data: WebSocketMessage) => {
        console.log('WebSocket mesajı alındı:', data);
        
        if (data.type === 'message' && data.data) {
          if (!data.data.id || !data.data.content || !data.data.sender || !data.data.timestamp) {
            console.error('Eksik mesaj verisi:', data);
            return;
          }

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
  )

  // Odaları yükle
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get<Room[]>('/api/v1/chat/rooms/');
      console.log('Rooms:', response.data);
      const sortedRooms = response.data.sort((a: Room, b: Room) => {
        const aTime = a.last_message ? new Date(a.last_message.timestamp).getTime() : new Date(a.created_at).getTime();
        const bTime = b.last_message ? new Date(b.last_message.timestamp).getTime() : new Date(b.created_at).getTime();
        return bTime - aTime;
      });
      setRooms(sortedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Sohbet odaları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mesajları yükle
  const fetchMessages = useCallback(async (roomId: number, pageNum: number = 1, append: boolean = false) => {
    try {
      setIsLoadingMore(true);
      const response = await axios.get(`/api/v1/chat/rooms/${roomId}/messages/?page=${pageNum}`);
      
      // API'den gelen results array'ini kullan
      const sortedMessages = response.data.results.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      if (append) {
        setMessages(prev => [...sortedMessages, ...prev]);
      } else {
        setMessages(sortedMessages);
      }

      // Pagination bilgilerini kontrol et
      setHasMore(!!response.data.next);
      setPage(response.data.current_page);
      setIsLoadingMore(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Mesajlar yüklenirken bir hata oluştu');
      setIsLoadingMore(false);
    }
  }, []);

  // URL'den oda seçimi ve ilk yükleme
  useEffect(() => {
    if (roomId && rooms.length > 0) {
      const room = rooms.find(r => r.id === parseInt(roomId));
      if (room) {
        setSelectedRoom(room);
        fetchMessages(room.id);
      }
    }
  }, [roomId, rooms, fetchMessages]);

  // İlk yükleme
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Seçili oda değiştiğinde mesajları yükle
  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
      scrollToBottom();
    }
  }, [selectedRoom, fetchMessages]);

  // Daha fazla mesaj yükleme
  const loadMoreMessages = useCallback(async () => {
    if (!selectedRoom || isLoadingMore || !hasMore) return;

    try {
      await fetchMessages(selectedRoom.id, page + 1, true);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  }, [selectedRoom, isLoadingMore, hasMore, page, fetchMessages]);

  // Scroll handler'ı düzelt
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLDivElement;
    if (!target || isLoadingMore || !hasMore) return;

    if (target.scrollTop < 100) {
      loadMoreMessages();
    }
  }, [loadMoreMessages, isLoadingMore, hasMore]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Mesaj gönderme
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      if (isConnected) {
        console.log('WebSocket üzerinden mesaj gönderiliyor...');
        
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
        
        // Önce mesajı göster
        setMessages(prev => [...prev, tempMessage]);
        scrollToBottom();

        // Sonra gönder
        const success = sendMessage(messageContent);
        if (!success) {
          throw new Error('WebSocket mesajı gönderilemedi');
        }
      } else {
        // HTTP fallback
        const response = await axios.post<Message>(
          `/api/v1/chat/rooms/${selectedRoom.id}/messages/`,
          { content: messageContent }
        );
        
        setMessages(prev => [...prev, response.data]);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast.error('Mesaj gönderilemedi');
      setNewMessage(messageContent); // Hata durumunda mesajı geri yükle
    }
  };

  // Scroll işlemleri
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getOtherParticipant = (room: Room) => {
    if (!room) return null
    // Müşteri için her zaman accountant'ı göster
    return room.accountant
  }

  // Emoji click handler'ı ekleyelim
  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prevMessage => prevMessage + emojiData.emoji);
  };

  // Dışarı tıklamayı dinleyen useEffect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('button')?.classList.contains('emoji-button')
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Bildirim izni isteği
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          console.log('Bildirim izni alındı');
        }
      } catch (error) {
        console.error('Bildirim izni alınamadı:', error);
      }
    }
  }, []);

  // Bildirim gösterme fonksiyonu
  const showNotification = useCallback((message: Message) => {
    if (notificationPermission === 'granted' && document.hidden) {
      const notification = new Notification('Yeni Mesaj', {
        body: message.content,
        icon: '/logo.png', // Uygulamanızın logosu
        tag: 'chat-message',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [notificationPermission]);

  // Sayfa yüklendiğinde bildirim izni iste
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Mesaj listesi render kısmını güncelleyelim
  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          Henüz mesaj yok
        </div>
      );
    }

    // Mesajları tarihe göre grupla
    const groupedMessages = messages.reduce((groups: Record<string, Message[]>, message) => {
      const date = new Date(message.timestamp).toLocaleDateString('tr-TR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});

    return Object.entries(groupedMessages).map(([date, dateMessages]) => (
      <div key={date} className="space-y-2">
        <div className="text-center">
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
            {date}
          </span>
        </div>
        {dateMessages.map((message) => (
          <div
            key={`${message.id}-${uuidv4()}`}
            className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-4 py-2 ${
                message.sender.id === user?.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm break-words">{message.content}</div>
              <div
                className={`text-xs mt-1 ${
                  message.sender.id === user?.id ? 'text-indigo-200' : 'text-gray-500'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString('tr-TR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    ));
  };

  // Kullanıcı adını formatlamak için yardımcı fonksiyon
  const formatUserName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email;
  };

  return (
    <PageContainer>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] bg-white rounded-lg shadow-lg">
        {/* Sol sidebar */}
        <div className={`
          w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col
          ${selectedRoom ? 'hidden lg:flex' : 'flex'}
        `}>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Mali Müşavirim</h2>
          </div>
          
          {/* Sohbet listesi scroll edilebilir */}
          <div className="overflow-y-auto h-48 lg:h-[calc(100vh-320px)]">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Henüz mesajınız bulunmuyor
              </div>
            ) : (
              rooms.map(room => {
                const otherParticipant = getOtherParticipant(room)
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedRoom?.id === room.id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900">
                        {otherParticipant ? formatUserName(otherParticipant) : 'Bilinmeyen Kullanıcı'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {otherParticipant?.email}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(room.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Sağ taraf - mesajlaşma alanı */}
        <div className={`
          flex-1 flex flex-col
          ${selectedRoom ? 'block' : 'hidden lg:block'}
        `}>
          {selectedRoom ? (
            <>
              <div className="p-4 border-b bg-white flex-shrink-0">
                <div className="flex items-center">
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="lg:hidden mr-2 text-gray-600 hover:text-gray-900"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex flex-col">
                    <h3 className="font-medium text-gray-900">
                      {getOtherParticipant(selectedRoom) 
                        ? formatUserName(getOtherParticipant(selectedRoom)!) 
                        : 'Bilinmeyen Kullanıcı'
                      }
                    </h3>
                    <div className="text-sm text-gray-500">
                      {getOtherParticipant(selectedRoom)?.email}
                    </div>
                  </div>
                </div>
              </div>

              <div 
                ref={messagesContainerRef}
                className="flex-grow overflow-y-auto p-4 bg-gray-50" 
              >
                <div className="space-y-4 min-h-full max-w-3xl mx-auto">
                  {isLoadingMore && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                  {renderMessages()}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="p-4 border-t bg-white flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex space-x-2 relative">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Mesajınızı yazın..."
                      className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12 text-gray-900 placeholder-gray-500"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors emoji-button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <FaceSmileIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {showEmojiPicker && (
                      <div 
                        ref={emojiPickerRef}
                        className="absolute bottom-[calc(100%+1rem)] right-0 z-50"
                      >
                        <div className="relative bg-white rounded-lg shadow-xl">
                          <button
                            className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-lg hover:bg-gray-100"
                            onClick={() => setShowEmojiPicker(false)}
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-500" />
                          </button>
                          <div className="emoji-picker-container">
                            <EmojiPicker
                              onEmojiClick={(emojiData) => {
                                onEmojiClick(emojiData);
                                setShowEmojiPicker(false);
                              }}
                              searchPlaceholder="Emoji ara..."
                              width={300}
                              height={400}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[80px]"
                  >
                    <span className="hidden sm:inline">Gönder</span>
                    <svg className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-4 text-center">
              <div>
                <p className="mb-2">Mesajlaşmak için mali müşavirinizi seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WebSocket bağlantı durumu */}
      <div className="fixed bottom-4 right-4 flex space-x-2">
        {notificationPermission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm hover:bg-indigo-200 transition-colors"
          >
            Bildirimlere izin ver
          </button>
        )}
      </div>
    </PageContainer>
  )
} 