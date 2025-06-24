import React from 'react';
import { Plus } from 'lucide-react';

export const ConversationHeader: React.FC = () => {
  return (
    <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Mensajes
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 font-medium">En línea</span>
          </div>
        </div>
        <button className="p-2 bg-white/80 hover:bg-white border border-gray-200 rounded-xl transition-all duration-200 hover:shadow-md">
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">
        Conecta con mentores y colaboradores de tu red
      </p>
    </div>
  );
};