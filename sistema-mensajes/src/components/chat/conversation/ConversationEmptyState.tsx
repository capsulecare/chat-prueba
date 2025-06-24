import React from 'react';
import { MessageCircle, Search } from 'lucide-react';

interface ConversationEmptyStateProps {
  searchTerm: string;
}

export const ConversationEmptyState: React.FC<ConversationEmptyStateProps> = ({
  searchTerm
}) => {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          {searchTerm ? (
            <Search className="w-8 h-8 text-gray-400" />
          ) : (
            <MessageCircle className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">
          {searchTerm ? 'No se encontraron conversaciones' : 'No hay conversaciones'}
        </h3>
        <p className="text-gray-500 text-sm">
          {searchTerm 
            ? 'Intenta con otros términos de búsqueda'
            : 'Comienza una nueva conversación para conectar'
          }
        </p>
      </div>
    </div>
  );
};