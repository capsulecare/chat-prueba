import React, { useState, useRef, useEffect } from 'react';
import type { ChatConversation, ChatMessage, ChatUser } from '../../../types/api';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from '../shared/ChatInput';
import { ChatEmptyState } from './ChatEmptyState';
import { Shield } from 'lucide-react';

interface ChatWindowProps {
  conversation: ChatConversation;
  messages: ChatMessage[];
  currentUser: ChatUser;
  onSendMessage: (message: string) => void;
  onBack?: () => void;
  typingUsers?: number[];
  onTyping?: () => void;
  disabled?: boolean;
  onLoadMoreMessages?: (conversationId: number, page: number) => Promise<ChatMessage[]>;
  hasMoreMessages?: boolean;
  loadingMoreMessages?: boolean;
  loadingMessages?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  onBack,
  typingUsers = [],
  onTyping,
  disabled = false,
  onLoadMoreMessages,
  hasMoreMessages = true,
  loadingMoreMessages = false,
  loadingMessages = false,
}) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | undefined>(undefined);

  // Obtener el otro participante
  const getOtherParticipant = (): ChatUser => {
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    return otherParticipant || conversation.participants[0];
  };

  const otherParticipant = getOtherParticipant();

  const handleInputChange = () => {
    if (disabled) return;
    
    if (!isTyping && onTyping) {
      setIsTyping(true);
      onTyping();
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white to-blue-50/30">
      {/* Header */}
      <ChatHeader 
        otherParticipant={otherParticipant}
        onBack={onBack}
        disabled={disabled}
      />

      {/* Alerta de estado */}
      {disabled && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200 p-4 flex-shrink-0">
          <div className="flex items-center gap-3 text-red-700">
            <Shield className="w-5 h-5" />
            <div>
              <div className="font-semibold">Chat deshabilitado</div>
              <div className="text-sm text-red-600">Se requiere conexión WebSocket para enviar mensajes</div>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de mensajes */}
      {messages.length === 0 ? (
        <ChatEmptyState 
          loading={loadingMessages}
          disabled={disabled}
          otherParticipant={otherParticipant}
        />
      ) : (
        <ChatMessages
          messages={messages}
          currentUser={currentUser}
          otherParticipant={otherParticipant}
          typingUsers={typingUsers}
          onLoadMoreMessages={onLoadMoreMessages}
          hasMoreMessages={hasMoreMessages}
          loadingMoreMessages={loadingMoreMessages}
          conversationId={conversation.id}
          disabled={disabled}
        />
      )}

      {/* Input */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
        <ChatInput 
          onSendMessage={onSendMessage} 
          onInputChange={handleInputChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};