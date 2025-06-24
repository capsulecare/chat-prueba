import { useEffect, useCallback } from 'react';
import { websocketService } from '../../services/websocketService';
import type { ChatConversation, ChatMessage, Mensaje } from '../../types/api';

interface UseWebSocketSubscriptionsProps {
  conversations: ChatConversation[];
  currentUserId: number;
  activeConversationId: number | null;
  onMessageReceived: (conversationId: number, message: any) => ChatMessage;
  onConversationUpdate: (conversationId: number, updates: Partial<ChatConversation>) => void;
  onNewConversationDetected: () => Promise<void>;
  markAsRead: (conversationId: number) => Promise<void>;
}

export const useWebSocketSubscriptions = ({
  conversations,
  currentUserId,
  activeConversationId,
  onMessageReceived,
  onConversationUpdate,
  onNewConversationDetected,
  markAsRead
}: UseWebSocketSubscriptionsProps) => {

  // Suscripción a conversaciones existentes
  useEffect(() => {
    if (!websocketService.isConnected() || conversations.length === 0) {
      return;
    }

    console.log('🔌 Configurando suscripciones WebSocket para conversaciones:', conversations.map(c => c.id));

    const unsubscribeFunctions: (() => void)[] = [];

    conversations.forEach(conversation => {
      try {
        const unsubscribe = websocketService.subscribeToConversation(
          conversation.id,
          async (mensaje: Mensaje) => {
            console.log('📨 MENSAJE RECIBIDO:', mensaje);
            
            // Agregar mensaje
            const chatMessage = onMessageReceived(conversation.id, mensaje);
            
            // Determinar si es de otro usuario y si el chat está activo
            const isFromOtherUser = chatMessage.senderId !== currentUserId;
            const isChatActive = activeConversationId === conversation.id;
            
            // Auto-marcar como leído si el chat está activo
            if (isFromOtherUser && isChatActive) {
              console.log('👁️ Auto-marcando mensaje como leído (chat activo)');
              setTimeout(() => {
                markAsRead(conversation.id);
              }, 100);
            }

            // Actualizar conversación
            const shouldIncrementUnread = isFromOtherUser && !isChatActive;
            
            onConversationUpdate(conversation.id, {
              lastMessage: chatMessage,
              updatedAt: chatMessage.timestamp,
              unreadCount: shouldIncrementUnread ? conversation.unreadCount + 1 : conversation.unreadCount
            });
          }
        );

        unsubscribeFunctions.push(unsubscribe);
        console.log(`✅ Suscrito a conversación: ${conversation.id}`);
      } catch (error) {
        console.error('❌ Error suscribiéndose a conversación:', conversation.id, error);
      }
    });

    return () => {
      console.log('🧹 Limpiando suscripciones WebSocket');
      unsubscribeFunctions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error en cleanup:', error);
        }
      });
    };
  }, [conversations.length, currentUserId, activeConversationId, onMessageReceived, onConversationUpdate, markAsRead]);

  // Suscripción global para nuevas conversaciones
  useEffect(() => {
    if (!websocketService.isConnected()) {
      return;
    }

    console.log('🌐 Configurando suscripción global para nuevas conversaciones...');

    // Suscribirse a un topic global del usuario (preparado para futuro)
    const globalTopic = `/topic/user/${currentUserId}/new-conversation`;
    
    const unsubscribeGlobal = websocketService.subscribeToConversation(
      0, // ID especial para suscripción global
      async (mensaje: Mensaje) => {
        console.log('🆕 NUEVA CONVERSACIÓN DETECTADA:', mensaje);
        await onNewConversationDetected();
      }
    );

    return () => {
      console.log('🧹 Limpiando suscripción global');
      unsubscribeGlobal();
    };
  }, [currentUserId, onNewConversationDetected]);
};