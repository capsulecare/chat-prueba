import React, { useState } from 'react';
import type { ChatConversation, ChatUser } from '../../../types/api';
import { ConversationHeader } from './ConversationHeader';
import { ConversationSearch } from './ConversationSearch';
import { ConversationItem } from './ConversationItem';
import { ConversationEmptyState } from './ConversationEmptyState';
import { ConversationLoadingState } from './ConversationLoadingState';

interface ConversationListProps {
  conversations: ChatConversation[];
  activeConversationId?: number | null;
  onSelectConversation: (conversationId: number) => void;
  currentUser: ChatUser;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  currentUser,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'mentorship'>('all');

  // Obtener el otro participante de una conversación
  const getOtherParticipant = (conversation: ChatConversation): ChatUser => {
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    return otherParticipant || conversation.participants[0];
  };

  // Filtrar conversaciones
  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = getOtherParticipant(conv);
    const matchesSearch = otherParticipant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filter) {
      case 'unread':
        return matchesSearch && conv.unreadCount > 0;
      case 'mentorship':
        return matchesSearch && conv.type === 'mentorship';
      default:
        return matchesSearch;
    }
  });

  if (loading) {
    return <ConversationLoadingState />;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border-r border-gray-200/50 h-full flex flex-col">
      <ConversationHeader />
      
      <ConversationSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filter={filter}
        onFilterChange={setFilter}
        conversations={conversations}
      />

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <ConversationEmptyState searchTerm={searchTerm} />
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const isActive = conversation.id === activeConversationId;
              
              return (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  otherParticipant={otherParticipant}
                  isActive={isActive}
                  onSelect={() => onSelectConversation(conversation.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};