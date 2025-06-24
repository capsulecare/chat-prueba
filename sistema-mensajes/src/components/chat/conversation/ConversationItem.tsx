import React from 'react';
import type { ChatConversation, ChatUser } from '../../../types/api';
import { MessageCircle, Users, Lightbulb } from 'lucide-react';
import { formatMessageTime } from '../../../utils/dateUtils';

interface ConversationItemProps {
  conversation: ChatConversation;
  otherParticipant: ChatUser;
  isActive: boolean;
  onSelect: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  otherParticipant,
  isActive,
  onSelect
}) => {
  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'mentorship':
        return <Lightbulb className="w-4 h-4 text-amber-500" />;
      case 'group':
        return <Users className="w-4 h-4 text-green-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'mentor':
        return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'colaborador':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 cursor-pointer rounded-xl mb-2 transition-all duration-200 hover:shadow-md ${
        isActive 
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md' 
          : 'bg-white/60 hover:bg-white/80 border border-gray-200/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <img
            src={otherParticipant.avatar}
            alt={otherParticipant.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
          {otherParticipant.status === 'online' && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {otherParticipant.name}
              </h3>
              {getConversationIcon(conversation.type)}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {conversation.lastMessage && (
                <span className="text-xs text-gray-500 font-medium">
                  {formatMessageTime(conversation.lastMessage.timestamp.toISOString())}
                </span>
              )}
              {conversation.unreadCount > 0 && (
                <div className="min-w-[20px] h-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-full flex items-center justify-center px-1.5 font-bold shadow-sm">
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 truncate mb-2 leading-relaxed">
            {conversation.lastMessage?.content || 'No hay mensajes aún'}
          </p>
          
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getRoleColor(otherParticipant.role || 'colaborador')}`}>
              {otherParticipant.role === 'mentor' ? '🎓 Mentor' : '🤝 Colaborador'}
            </span>
            {otherParticipant.expertise && otherParticipant.expertise.length > 0 && (
              <span className="text-xs text-gray-500 truncate">
                • {otherParticipant.expertise[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};