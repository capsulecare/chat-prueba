import React, { useState } from 'react';
import { User, Users, MessageCircle, RefreshCw } from 'lucide-react';

interface UserSelectorProps {
  currentUserId: number;
  onUserChange: (userId: number) => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ 
  currentUserId, 
  onUserChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // ✅ USAR LA MISMA LISTA QUE EN dataTransformers.ts
  const testUsers = [
    { id: 1, name: 'Ana Torres', role: 'Mentor', avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', color: 'bg-blue-500' },
    { id: 2, name: 'Jose Perez', role: 'Colaborador', avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', color: 'bg-green-500' },
    { id: 3, name: 'Luisa Gomez', role: 'Mentor', avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', color: 'bg-purple-500' },
    { id: 4, name: 'Marco Diaz', role: 'Colaborador', avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', color: 'bg-orange-500' },
  ];

  const currentUser = testUsers.find(user => user.id === currentUserId) || testUsers[0];

  const handleUserSelect = (userId: number) => {
    onUserChange(userId);
    setIsOpen(false);
    
    // Recargar la página para simular un nuevo login
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const openNewWindow = (userId: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('userId', userId.toString());
    window.open(url.toString(), '_blank');
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      {/* Botón principal */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-blue-300"
        >
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${currentUser.color} border-2 border-white rounded-full`}></div>
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 text-sm">{currentUser.name}</div>
            <div className="text-xs text-gray-500">ID: {currentUser.id} • {currentUser.role}</div>
          </div>
          <Users className="w-4 h-4 text-gray-400" />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 mb-1">Seleccionar Usuario</h3>
              <p className="text-sm text-gray-600">Cambia de usuario para probar el chat</p>
            </div>

            {/* Lista de usuarios */}
            <div className="max-h-64 overflow-y-auto">
              {testUsers.map((user) => (
                <div key={user.id} className="p-3 border-b border-gray-50 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${user.color} border-2 border-white rounded-full`}></div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">ID: {user.id} • {user.role}</div>
                      </div>
                      {user.id === currentUserId && (
                        <div className="ml-auto">
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                            Actual
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {user.id !== currentUserId && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleUserSelect(user.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white text-xs px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Cambiar Usuario
                      </button>
                      <button
                        onClick={() => openNewWindow(user.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-500 text-white text-xs px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Nueva Ventana
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500 text-center">
                💡 Abre múltiples ventanas con diferentes usuarios para probar el chat en tiempo real
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};