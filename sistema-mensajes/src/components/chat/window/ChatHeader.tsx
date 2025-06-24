import React from 'react';
import type { ChatUser } from '../../../types/api';
import { Phone, Video, MoreVertical, Info, ArrowLeft } from 'lucide-react';

interface ChatHeaderProps {
  otherParticipant: ChatUser;
  onBack?: () => void;
  disabled?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherParticipant,
  onBack,
  disabled = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'away':
        return 'text-yellow-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'En línea';
      case 'away':
        return 'Ausente';
      default:
        return 'Desconectado';
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
    <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 p-4 flex-shrink-0 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="relative">
            <img
              src={otherParticipant.avatar}
              alt={otherParticipant.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
            />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
              otherParticipant.status === 'online' ? 'bg-green-500' : 
              otherParticipant.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
            }`}></div>
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 truncate text-lg">
                {otherParticipant.name}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <p className={`text-sm font-medium ${getStatusColor(otherParticipant.status || 'offline')}`}>
                {getStatusText(otherParticipant.status || 'offline')}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getRoleColor(otherParticipant.role || 'colaborador')}`}>
                {otherParticipant.role === 'mentor' ? '🎓 Mentor' : '🤝 Colaborador'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            className={`p-3 rounded-xl transition-all duration-200 ${
              disabled 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
            }`}
            disabled={disabled}
          >
            <Phone className="w-5 h-5" />
          </button>
          <button 
            className={`p-3 rounded-xl transition-all duration-200 ${
              disabled 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
            }`}
            disabled={disabled}
          >
            <Video className="w-5 h-5" />
          </button>
          <button className="hidden sm:block p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
            <Info className="w-5 h-5" />
          </button>
          <button className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {otherParticipant.expertise && otherParticipant.expertise.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {otherParticipant.expertise.slice(0, 4).map((skill, index) => (
            <span key={index} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 font-medium">
              {skill}
            </span>
          ))}
          {otherParticipant.expertise.length > 4 && (
            <span className="text-xs text-gray-500 px-3 py-1">+{otherParticipant.expertise.length - 4} más</span>
          )}
        </div>
      )}
    </div>
  );
};