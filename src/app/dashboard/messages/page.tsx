'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PageContainer } from '@/components/PageContainer'
import axios from '@/lib/axios'
import { useAuth } from '@/contexts/auth'
import { toast } from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import EmojiPicker from 'emoji-picker-react'
import { FaceSmileIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { EmojiClickData } from 'emoji-picker-react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { getAuthToken } from '@/utils/auth'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

interface User {
  id: number
  email: string
  user_type: string
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

// Base message interface
interface BaseMessage {
  id: number;
  sender: {
    id: number;
    email: string;
    user_type: string;
  };
  content: string;
  message_type: 'text' | 'file';
  timestamp: string;
}

// Text message
interface TextMessage extends BaseMessage {
  message_type: 'text';
  file: null;
}

// File message
interface FileMessage extends BaseMessage {
  message_type: 'file';
  file: {
    url: string;
    name: string;
    type: string | null;
    size: number;
  };
}

// Union type for all message types
type Message = TextMessage | FileMessage;

interface Client {
  id: number
  first_name: string
  last_name: string
  email: string
}

interface WebSocketMessage {
  type: 'message';
  data: Message;
}

interface WebSocketNotification {
  type: 'notification';
  data: {
    message: Message;
    room_id: number;
    sender: User;
  };
}

interface WebSocketOther {
  type: 'ping' | 'pong' | 'connection_established';
  data?: never;
}

type WebSocketData = WebSocketMessage | WebSocketNotification | WebSocketOther;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000'

// FileViewerModal komponenti
interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    url: string;
    name: string;
    type: string | null;
    size: number;
  };
}

const FileViewerModal = ({ isOpen, onClose, file }: FileViewerModalProps) => {
  const [imageError, setImageError] = useState(false);

  if (!file?.name) {
    return null;
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension);
  const isPdf = fileExtension === 'pdf';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform bg-white rounded-lg shadow-xl transition-all">
                <div className="p-4 border-b flex justify-between items-center">
                  <Dialog.Title as="h3" className="text-lg font-medium">
                    {file.name}
                  </Dialog.Title>
                  <div className="flex items-center space-x-2">
                    <a
                      href={file.url}
                      download={file.name}
                      className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      İndir
                    </a>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <XMarkIcon className="h-6 w-6 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="p-4 max-h-[80vh] overflow-y-auto">
                  {isPdf ? (
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true`}
                      className="w-full h-[70vh] border-0"
                      title={file.name}
                    />
                  ) : isImage ? (
                    <div className="relative flex items-center justify-center min-h-[50vh]">
                      {imageError ? (
                        <div className="text-red-500 text-center">
                          <p>Resim yüklenemedi</p>
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 underline"
                          >
                            Yeni sekmede aç
                          </a>
                        </div>
                      ) : (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="max-w-full max-h-[70vh] object-contain"
                          onError={() => setImageError(true)}
                          loading="lazy"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p>Bu dosya türü önizleme için desteklenmiyor.</p>
                      <a
                        href={file.url}
                        download={file.name}
                        className="text-indigo-600 hover:text-indigo-800 underline"
                      >
                        İndirmek için tıklayın
                      </a>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default function MessagesPage() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const roomId = searchParams?.get('room')
  const [clients, setClients] = useState<Client[]>([])
  const isAccountant = user?.user_type === 'accountant'
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const token = getAuthToken()
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const { isConnected, sendMessage } = useWebSocket(
    selectedRoom?.id.toString() || null,
    {
      token,
      onMessage: (data: WebSocketData) => {
        if (data.type === 'message' && data.data) {
          setMessages(prev => {
            if (prev.some(msg => msg.id === data.data.id)) {
              return prev;
            }
            if (data.data.sender.id !== user?.id) {
              showNotification(data.data);
            }
            return [...prev, data.data];
          });
          scrollToBottom();
        } else if (data.type === 'notification' && data.data) {
          showNotification(data.data.message);
        }
      },
      reconnectAttempts: 3,
      reconnectInterval: 2000
    }
  )

  const fetchMessages = useCallback(async (roomId: number, pageNum: number = 1, append: boolean = false) => {
    try {
      setIsLoadingMore(true);
      const response = await axios.get(`/api/v1/chat/rooms/${roomId}/messages/?page=${pageNum}`);
      console.log('Messages response:', response.data);

      const messages = response.data.results;
      if (!Array.isArray(messages)) {
        throw new Error('Invalid messages format');
      }

      const sortedMessages = messages.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      if (append) {
        setMessages(prev => [...sortedMessages, ...prev]);
      } else {
        setMessages(sortedMessages);
      }

      setHasMore(!!response.data.next);
      setPage(response.data.current_page || pageNum);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Mesajlar yüklenirken bir hata oluştu');
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  const handleRoomSelect = useCallback((room: Room) => {
    setSelectedRoom(room);
    if (room) {
      fetchMessages(room.id);
    }
  }, [fetchMessages]);

  useEffect(() => {
    if (roomId && rooms.length > 0) {
      const room = rooms.find(r => r.id === parseInt(roomId));
      if (room) {
        setSelectedRoom(room);
        fetchMessages(room.id, 1, false);
      }
    }
  }, [roomId, rooms, fetchMessages]);

  useEffect(() => {
    if (selectedRoom) {
      console.log('Selected room changed, fetching messages for room:', selectedRoom.id);
      fetchMessages(selectedRoom.id, 1, false);
      setPage(1);
      setHasMore(true);
    }
  }, [selectedRoom, fetchMessages]);

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/v1/chat/rooms/')
      console.log('Rooms:', response.data)
      const sortedRooms = response.data.sort((a: Room, b: Room) => {
        const aTime = a.last_message ? new Date(a.last_message.timestamp).getTime() : new Date(a.created_at).getTime()
        const bTime = b.last_message ? new Date(b.last_message.timestamp).getTime() : new Date(b.created_at).getTime()
        return bTime - aTime
      })
      setRooms(sortedRooms)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('Sohbet odaları yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/v1/accountants/clients/')
      setClients(response.data)
    } catch (error) {
      toast.error('Müşteriler yüklenirken bir hata oluştu')
    }
  }

  const handleNewChat = async (clientId: number) => {
    try {
      const response = await axios.post('/api/v1/chat/rooms/create/', {
        client_id: clientId
      })
      setRooms([...rooms, response.data])
      setSelectedRoom(response.data)
    } catch (error) {
      toast.error('Sohbet başlatılırken bir hata oluştu')
    }
  }

  const createRoom = async (clientId: number) => {
    try {
      const response = await axios.post('/api/v1/chat/rooms/create/', {
        client_id: clientId
      })
      setRooms([...rooms, response.data])
      setSelectedRoom(response.data)
    } catch (error) {
      toast.error('Sohbet odası oluşturulurken bir hata oluştu')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !newMessage.trim()) return;

    try {
      const response = await axios.post(
        `/api/v1/chat/rooms/${selectedRoom.id}/messages/`,
        {
          content: newMessage.trim(),
          message_type: 'text'
        }
      );

      if (response.data) {
        setMessages(prev => [...prev, response.data]);
        scrollToBottom();
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Mesaj gönderilemedi');
    }
  };

  const getOtherParticipant = (room: Room) => {
    if (!room) return null
    // Eğer current user accountant ise client'ı, değilse accountant'ı döndür
    return user?.user_type === 'accountant' ? room.client : room.accountant
  }

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prevMessage => prevMessage + emojiData.emoji)
  }

  const loadMoreMessages = useCallback(async () => {
    if (!selectedRoom || isLoadingMore || !hasMore) return;

    try {
      console.log('Loading more messages for page:', page + 1);
      await fetchMessages(selectedRoom.id, page + 1, true);
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Daha fazla mesaj yüklenirken hata oluştu');
    }
  }, [selectedRoom, page, isLoadingMore, hasMore, fetchMessages]);

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

  useEffect(() => {
    if (isAccountant) {
      fetchClients();
    }
    fetchRooms();
  }, [isAccountant]);

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

  const handleTyping = () => {
    if (sendMessage) {
      sendMessage(JSON.stringify({
        type: 'typing',
        room: selectedRoom?.id
      }))
    }
  }

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
        body: `${message.sender.email}: ${message.content}`,
        icon: '/logo.png',
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

  return (
    <PageContainer>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] bg-white rounded-lg shadow-lg">
        <div className={`
          w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col
          ${selectedRoom ? 'hidden lg:flex' : 'flex'}
        `}>
          <div className="p-4 border-b flex-shrink-0">
            <h2 className="text-lg font-semibold mb-4">
              {isAccountant ? 'Müşterilerimle Sohbetler' : 'Mali Müşavirimle Sohbet'}
            </h2>
            
            {isAccountant && (
              <FormControl fullWidth size="small">
                <InputLabel>Yeni Sohbet Başlat</InputLabel>
                <Select
                  label="Yeni Sohbet Başlat"
                  value=""
                  onChange={(e) => handleNewChat(Number(e.target.value))}
                >
                  {clients.map(client => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </div>
          
          <div className="overflow-y-auto flex-grow">
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
                    <div className="font-medium">
                      {otherParticipant ? otherParticipant.email : 'Bilinmeyen Kullanıcı'}
                    </div>
                    {room.last_message && (
                      <div className="text-sm text-gray-500 truncate">
                        {room.last_message.content}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(room.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

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
                  <h3 className="font-medium">
                    {getOtherParticipant(selectedRoom)?.email || 'Bilinmeyen Kullanıcı'}
                  </h3>
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

                  {Array.isArray(messages) && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Henüz mesaj yok
                    </div>
                  ) : Array.isArray(messages) ? (
                    messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-4 py-2 ${
                            message.sender.id === user?.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.content && (
                            <div className="text-sm break-words">
                              {message.content}
                            </div>
                          )}
                          <div className={`text-xs mt-1 ${
                            message.sender.id === user?.id ? 'text-indigo-200' : 'text-gray-500'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString('tr-TR')}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Mesajlar yüklenirken bir hata oluştu
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="p-4 border-t bg-white flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
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
                        className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-24 text-gray-900 placeholder-gray-500"
                      />
                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors emoji-button absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <FaceSmileIcon className="h-5 w-5" />
                      </button>
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
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-4 text-center">
              <div>
                <p className="mb-2">Mesajlaşmak için bir sohbet seçin</p>
                <p className="text-sm">veya yeni bir sohbet başlatın</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WebSocket ve bildirim durumu */}
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