import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage, ChatUser } from '../../../types/api';
import { MessageBubble } from '../shared/MessageBubble';
import { DateSeparator } from '../shared/DateSeparator';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface ChatMessagesProps {
  messages: ChatMessage[];
  currentUser: ChatUser;
  otherParticipant: ChatUser;
  typingUsers: number[];
  onLoadMoreMessages?: (conversationId: number, page: number) => Promise<ChatMessage[]>;
  hasMoreMessages?: boolean;
  loadingMoreMessages?: boolean;
  conversationId: number;
  disabled?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  currentUser,
  otherParticipant,
  typingUsers,
  onLoadMoreMessages,
  hasMoreMessages = true,
  loadingMoreMessages = false,
  conversationId,
  disabled = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const lastScrollTop = useRef<number>(0);
  const hasScrolledToBottom = useRef(false);

  // Agrupar mensajes por fecha
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { date: Date; messages: ChatMessage[] }[] = [];
    
    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp);
      const dateKey = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
      
      const existingGroup = groups.find(group => 
        group.date.getTime() === dateKey.getTime()
      );
      
      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({
          date: dateKey,
          messages: [message]
        });
      }
    });
    
    return groups;
  };

  // Manejar scroll para cargar más mensajes
  const handleScroll = async () => {
    if (!messagesContainerRef.current || !onLoadMoreMessages || isLoadingMore || !hasMoreMessages) {
      return;
    }

    const container = messagesContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;

    if (scrollTop < 100 && scrollTop < lastScrollTop.current) {
      setIsLoadingMore(true);
      
      const currentScrollHeight = scrollHeight;
      const currentScrollTop = scrollTop;
      
      try {
        const nextPage = currentPage + 1;
        const newMessages = await onLoadMoreMessages(conversationId, nextPage);
        
        if (newMessages && newMessages.length > 0) {
          setCurrentPage(nextPage);
          
          setTimeout(() => {
            if (messagesContainerRef.current) {
              const newScrollHeight = messagesContainerRef.current.scrollHeight;
              const heightDifference = newScrollHeight - currentScrollHeight;
              messagesContainerRef.current.scrollTop = currentScrollTop + heightDifference;
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error cargando más mensajes:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }

    const isNearBottom = scrollHeight - scrollTop - container.clientHeight < 150;
    setShouldScrollToBottom(isNearBottom);
    lastScrollTop.current = scrollTop;
  };

  // Scroll automático
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior,
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  // Scroll inicial
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledToBottom.current) {
      setTimeout(() => {
        scrollToBottom('auto');
        setShouldScrollToBottom(true);
        setCurrentPage(0);
        hasScrolledToBottom.current = true;
      }, 50);
    }
  }, [messages.length]);

  // Reset al cambiar conversación
  useEffect(() => {
    hasScrolledToBottom.current = false;
    setCurrentPage(0);
    setShouldScrollToBottom(true);
    setIsLoadingMore(false);
  }, [conversationId]);

  // Scroll para mensajes nuevos
  useEffect(() => {
    if (messages.length > 0 && shouldScrollToBottom && hasScrolledToBottom.current) {
      const lastMessage = messages[messages.length - 1];
      const isRecentMessage = new Date().getTime() - lastMessage.timestamp.getTime() < 5000;
      
      if (isRecentMessage) {
        setTimeout(() => {
          scrollToBottom('smooth');
        }, 100);
      }
    }
  }, [messages.length]);

  // Listener de scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let timeoutId: number;
    const throttledScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(handleScroll, 100);
    };

    container.addEventListener('scroll', throttledScroll);
    return () => {
      container.removeEventListener('scroll', throttledScroll);
      clearTimeout(timeoutId);
    };
  }, [currentPage, hasMoreMessages, isLoadingMore, onLoadMoreMessages]);

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4"
      style={{ minHeight: 0 }}
    >
      <div className="space-y-1">
        {/* Indicador de carga superior */}
        {isLoadingMore && (
          <div className="flex justify-center py-4 sticky top-0 z-10">
            <div className="bg-white/90 backdrop-blur-sm border border-blue-200 rounded-xl px-4 py-3 shadow-lg">
              <LoadingSpinner text="Cargando mensajes anteriores..." size="sm" />
            </div>
          </div>
        )}

        {/* Indicador de inicio de conversación */}
        {!hasMoreMessages && messages.length > 0 && (
          <div className="flex justify-center py-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl px-6 py-4 shadow-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl">🎉</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Inicio de la conversación</h4>
                <p className="text-sm text-gray-600">
                  Este es el comienzo de tu conversación con {otherParticipant.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mensajes agrupados por fecha */}
        {messageGroups.map((group) => (
          <div key={group.date.getTime()}>
            <DateSeparator date={group.date} />
            <div className="space-y-4">
              {group.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  sender={message.sender || otherParticipant}
                  isOwn={message.senderId === currentUser.id}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Indicador de typing */}
        {typingUsers.length > 0 && !disabled && (
          <div className="flex gap-3 mb-4 mt-4">
            <div className="flex-shrink-0">
              <img
                src={otherParticipant.avatar}
                alt={otherParticipant.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600 mr-2">{otherParticipant.name} está escribiendo</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};