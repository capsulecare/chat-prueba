import { Client } from '@stomp/stompjs';
import { API_CONFIG } from '../../config/api';
import type { MensajeWebSocketDTO, UsuarioEscribiendoDTO, MarcarLeidosRequest } from '../../types/api';

export class MessagePublisher {
  constructor(private getClient: () => Client | null) {}

  sendMessage(message: MensajeWebSocketDTO): void {
    const client = this.getClient();
    if (!client) {
      throw new Error('WebSocket not connected');
    }

    console.log('📤 Enviando mensaje por WebSocket:', message);
    
    try {
      client.publish({
        destination: API_CONFIG.WEBSOCKET.ENDPOINTS.ENVIAR_MENSAJE,
        body: JSON.stringify(message),
      });
      
      console.log('✅ Mensaje enviado a:', API_CONFIG.WEBSOCKET.ENDPOINTS.ENVIAR_MENSAJE);
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw error;
    }
  }

  sendTypingNotification(typing: UsuarioEscribiendoDTO): void {
    const client = this.getClient();
    if (!client) {
      console.warn('⚠️ WebSocket no conectado, no se puede enviar typing notification');
      return;
    }

    try {
      client.publish({
        destination: API_CONFIG.WEBSOCKET.ENDPOINTS.TYPING,
        body: JSON.stringify(typing),
      });
    } catch (error) {
      console.error('❌ Error enviando typing notification:', error);
    }
  }

  markAsRead(request: MarcarLeidosRequest): void {
    const client = this.getClient();
    if (!client) {
      console.warn('⚠️ WebSocket no conectado, no se puede marcar como leído');
      return;
    }

    try {
      client.publish({
        destination: API_CONFIG.WEBSOCKET.ENDPOINTS.LEER_MENSAJES,
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('❌ Error marcando como leído:', error);
    }
  }
}