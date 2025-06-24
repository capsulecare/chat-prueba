import React from 'react';
import type { ChatUser } from '../../../types/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface ChatEmptyStateProps {
  loading?: boolean;
  disabled?: boolean;
  otherParticipant: ChatUser;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  loading = false,
  disabled = false,
  otherParticipant
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Cargando conversación...
          </h3>
          <div className="flex justify-center">
            <LoadingSpinner 
              text={`Obteniendo mensajes de ${otherParticipant.name}`}
              size="md"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-sm mx-auto">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <span className="text-white text-4xl">👋</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          ¡Comienza la conversación!
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {disabled 
            ? 'Conecta WebSocket para comenzar a chatear en tiempo real'
            : `Conecta con ${otherParticipant.name} y comienza a compartir ideas y conocimientos.`
          }
        </p>
      </div>
    </div>
  );
};