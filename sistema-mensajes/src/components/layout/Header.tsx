import React from 'react';
import { MessageCircle, Users, Calendar, Settings, User, Search, Bug } from 'lucide-react';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { useNotifications } from '../../hooks/useNotifications';

interface HeaderProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  totalUnreadCount?: number;
  conversations?: any[];
  activeConversationId?: number | null;
  onSelectConversation?: (conversationId: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeSection = 'messages', 
  onSectionChange,
  totalUnreadCount = 0,
  conversations = [],
  activeConversationId = null,
  onSelectConversation
}) => {
  // ✅ USAR HOOK DE NOTIFICACIONES
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearAllNotifications
  } = useNotifications(conversations, activeConversationId);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Users },
    { id: 'messages', label: 'Mensajes', icon: MessageCircle },
    { id: 'events', label: 'Eventos', icon: Calendar },
    { id: 'mentors', label: 'Mentores', icon: User },
    { id: 'debug', label: 'Debug', icon: Bug },
  ];

  // ✅ FUNCIÓN CORREGIDA PARA MANEJAR CLIC EN NOTIFICACIÓN
  const handleNotificationClick = (conversationId: number) => {
    console.log('🎯 Header: Navegando a conversación desde notificación:', conversationId);
    
    // ✅ PASO 1: Cambiar a sección de mensajes
    if (onSectionChange) {
      onSectionChange('messages');
    }
    
    // ✅ PASO 2: Seleccionar conversación específica (con delay para asegurar que la sección cambie primero)
    if (onSelectConversation && conversationId > 0) {
      // Usar setTimeout para asegurar que el cambio de sección se procese primero
      setTimeout(() => {
        onSelectConversation(conversationId);
      }, 100);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SL</span>
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">SkillLink</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange?.(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search - Hidden on mobile */}
            <button className="hidden sm:flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200">
              <Search className="w-4 h-4" />
            </button>

            {/* ✅ DROPDOWN DE NOTIFICACIONES COMPLETO */}
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onNotificationClick={handleNotificationClick}
              onMarkAsRead={markNotificationAsRead}
              onClearAll={clearAllNotifications}
            />

            {/* Profile */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">Tu Perfil</p>
                <p className="text-xs text-gray-500">Colaborador</p>
              </div>
              <img
                src="https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
                alt="Tu perfil"
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>

            {/* Settings */}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange?.(item.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};