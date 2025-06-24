import React from 'react';
import { Search } from 'lucide-react';
import type { ChatConversation } from '../../../types/api';

interface ConversationSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filter: 'all' | 'unread' | 'mentorship';
  onFilterChange: (filter: 'all' | 'unread' | 'mentorship') => void;
  conversations: ChatConversation[];
}

export const ConversationSearch: React.FC<ConversationSearchProps> = ({
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  conversations
}) => {
  const filterOptions = [
    { key: 'all', label: 'Todos', count: conversations.length },
    { key: 'unread', label: 'No leídos', count: conversations.filter(c => c.unreadCount > 0).length },
    { key: 'mentorship', label: 'Mentoría', count: conversations.filter(c => c.type === 'mentorship').length }
  ];

  return (
    <div className="p-4 border-b border-gray-200/50 bg-white/50 flex-shrink-0">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar conversaciones..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-sm placeholder-gray-500"
        />
      </div>
      
      <div className="flex gap-2">
        {filterOptions.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key as any)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              filter === key
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-white/80 text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                filter === key ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};