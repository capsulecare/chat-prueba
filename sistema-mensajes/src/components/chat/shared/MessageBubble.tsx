import React from 'react';
import type { ChatMessage, ChatUser } from '../../../types/api';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { formatChatTime } from '../../../utils/dateUtils';

interface MessageBubbleProps {
  message: ChatMessage;
  sender: ChatUser;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, sender, isOwn }) => {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {/* ✅ AVATAR SOLO PARA MENSAJES DE OTROS (lado izquierdo) */}
      {!isOwn && (
        <div className="flex-shrink-0 self-end">
          <img
            src={sender.avatar}
            alt={sender.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        </div>
      )}
      
      <div className={`flex flex-col max-w-[75%] sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* ✅ ELIMINADO: Ya no mostramos nombres arriba de los mensajes */}
        
        {/* ✅ BURBUJA DEL MENSAJE - POSICIÓN CORREGIDA */}
        <div
          className={`px-4 py-3 rounded-2xl max-w-full break-words shadow-sm ${
            isOwn
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md' // ✅ MIS MENSAJES: Degradado azul-morado, lado derecho
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md' // ✅ OTROS MENSAJES: Blanco, lado izquierdo
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {/* ✅ INFORMACIÓN DEL MENSAJE */}
        <div className={`flex items-center gap-2 mt-1 px-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-gray-500 font-medium">
            {formatChatTime(message.timestamp.toISOString())}
          </span>
          {/* ✅ ESTADO SOLO PARA MIS MENSAJES */}
          {isOwn && (
            <div className="flex items-center gap-1">
              {getStatusIcon()}
            </div>
          )}
        </div>
      </div>

      {/* ✅ AVATAR PARA MIS MENSAJES (lado derecho) */}
      {isOwn && (
        <div className="flex-shrink-0 self-end">
          <img
            src={sender.avatar}
            alt="Tú"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-200 shadow-sm"
          />
        </div>
      )}
    </div>
  );
};