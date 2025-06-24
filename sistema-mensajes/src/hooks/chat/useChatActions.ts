import { useCallback } from 'react';
import { websocketService } from '../../services/websocketService';
import { apiService } from '../../services/apiService';
import type { MensajeWebSocketDTO, MarcarLeidosRequest, UsuarioEscribiendoDTO } from '../../types/api';

export const useChatActions = (currentUserId: number) => {

  // Enviar mensaje por WebSocket
  const sendMessage = useCallback(async (conversationId: number, content: string) => {
    try {
      console.log('📤 Enviando mensaje por WebSocket:', {
        conversationId,
        content,
        currentUserId,
        wsConnected: websocketService.isConnected()
      });

      const messageDto: MensajeWebSocketDTO = {
        idConversacion: conversationId,
        idEmisor: currentUserId,
        contenido: content
      };

      if (websocketService.isConnected()) {
        console.log('🚀 Enviando por WebSocket:', messageDto);
        websocketService.sendMessage(messageDto);
        console.log('✅ Mensaje enviado por WebSocket');
      } else {
        console.log('❌ WebSocket no conectado');
        throw new Error('WebSocket no conectado');
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
      throw err;
    }
  }, [currentUserId]);

  // Marcar mensajes como leídos
  const markAsRead = useCallback(async (conversationId: number) => {
    try {
      console.log('👁️ Marcando mensajes como leídos para conversación:', conversationId);
      
      const request: MarcarLeidosRequest = {
        idConversacion: conversationId,
        idUsuario: currentUserId
      };

      if (websocketService.isConnected()) {
        websocketService.markAsRead(request);
      } else {
        await apiService.marcarMensajesComoLeidos(request);
      }
    } catch (err) {
      console.error('Error marking as read:', err);
      throw err;
    }
  }, [currentUserId]);

  // Notificar que está escribiendo
  const sendTypingNotification = useCallback((conversationId: number) => {
    if (websocketService.isConnected()) {
      const typingDto: UsuarioEscribiendoDTO = {
        idConversacion: conversationId,
        idUsuario: currentUserId
      };
      websocketService.sendTypingNotification(typingDto);
    }
  }, [currentUserId]);

  return {
    sendMessage,
    markAsRead,
    sendTypingNotification
  };
};