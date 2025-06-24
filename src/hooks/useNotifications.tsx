import { useState, useEffect, useCallback } from 'react';
import type { ChatConversation, ChatMessage } from '../types/api';

export interface Notification {
  id: string;
  conversationId: number;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export const useNotifications = (conversations: ChatConversation[], activeConversationId: number | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ Calcular notificaciones basadas en conversaciones
  useEffect(() => {
    const newNotifications: Notification[] = [];
    let totalUnread = 0;

    conversations.forEach(conversation => {
      if (conversation.unreadCount > 0) {
        totalUnread += conversation.unreadCount;
        
        // ✅ SOLO crear notificación si NO es la conversación activa
        if (conversation.id !== activeConversationId) {
          // ✅ ARREGLO CRÍTICO: Encontrar al OTRO participante (no el usuario actual)
          const otherParticipant = conversation.participants.find(p => p.name !== 'Tú');
          
          if (otherParticipant && conversation.lastMessage) {
            // ✅ VERIFICAR que el último mensaje NO sea del usuario actual
            const isMessageFromOther = conversation.lastMessage.senderId !== conversation.participants.find(p => p.name === 'Tú')?.id;
            
            if (isMessageFromOther) {
              newNotifications.push({
                id: `${conversation.id}-${conversation.lastMessage.id}`,
                conversationId: conversation.id,
                senderName: otherParticipant.name, // ✅ NOMBRE CORRECTO del otro usuario
                senderAvatar: otherParticipant.avatar || '', // ✅ AVATAR CORRECTO del otro usuario
                message: conversation.lastMessage.content,
                timestamp: conversation.lastMessage.timestamp,
                read: false
              });
            }
          }
        }
      }
    });

    // ✅ Ordenar por timestamp descendente (más recientes primero)
    newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // ✅ LIMITAR A 5 NOTIFICACIONES MÁXIMO
    const limitedNotifications = newNotifications.slice(0, 5);

    setNotifications(limitedNotifications);
    setUnreadCount(totalUnread);
  }, [conversations, activeConversationId]);

  // ✅ Marcar notificación como leída
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // ✅ Limpiar todas las notificaciones
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearAllNotifications
  };
};