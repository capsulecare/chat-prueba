import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, MessageCircle, Clock } from 'lucide-react';
import type { Notification } from '../../hooks/useNotifications';
import { formatMessageTime } from '../../utils/dateUtils';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick: (conversationId: number) => void;
  onMarkAsRead: (notificationId: string) => void;
  onClearAll: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAsRead,
  onClearAll
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    console.log('🎯 Clic en notificación:', notification.conversationId);
    onNotificationClick(notification.conversationId);
    onMarkAsRead(notification.id);
    setIsOpen(false);
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ✅ BOTÓN DE CAMPANITA CON CURSOR POINTER */}
      <button
        onClick={() => {
          console.log('🔔 Clic en campanita - Abriendo dropdown');
          setIsOpen(!isOpen);
        }}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center px-1.5 font-bold shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* ✅ DROPDOWN DE NOTIFICACIONES */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* ✅ HEADER */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Notificaciones</h3>
                <p className="text-sm text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} mensajes sin leer` : 'Todo al día'}
                </p>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-all duration-200"
                >
                  Limpiar todo
                </button>
              )}
            </div>
          </div>

          {/* ✅ LISTA DE NOTIFICACIONES */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">¡Todo al día!</h4>
                <p className="text-gray-500 text-sm">No tienes notificaciones pendientes</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-3">
                      {/* ✅ AVATAR */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={notification.senderAvatar}
                          alt={notification.senderName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                          <MessageCircle className="w-2 h-2 text-white" />
                        </div>
                      </div>

                      {/* ✅ CONTENIDO */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {notification.senderName}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-500 font-medium">
                              {formatMessageTime(notification.timestamp.toISOString())}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {truncateMessage(notification.message)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ✅ FOOTER */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  console.log('🎯 Ver todos los mensajes');
                  onNotificationClick(0); // Ir a mensajes sin conversación específica
                }}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-800 font-medium py-2 rounded-lg hover:bg-white transition-all duration-200"
              >
                Ver todos los mensajes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};