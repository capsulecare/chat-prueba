import { Client } from '@stomp/stompjs';
import type { MensajeWebSocketDTO, UsuarioEscribiendoDTO, MarcarLeidosRequest, Mensaje } from '../types/api';
import { API_CONFIG } from '../config/api';

export type MessageHandler = (message: Mensaje) => void;
export type TypingHandler = (userId: number) => void;
export type ReadHandler = (userId: number) => void;

class WebSocketService {
  private client: Client | null = null;
  private connected = false;
  private subscriptions = new Map<string, any>();
  private connectionPromise: Promise<void> | null = null;

  connect(): Promise<void> {
    // ✅ Evitar múltiples conexiones simultáneas
    if (this.connectionPromise) {
      console.log('🔄 Conexión ya en progreso, reutilizando promesa...');
      return this.connectionPromise;
    }

    if (this.connected && this.client) {
      console.log('✅ WebSocket ya conectado');
      return Promise.resolve();
    }

    console.log('🚀 Iniciando nueva conexión WebSocket...');
    console.log('🔗 URL: ws://localhost:8080/ws');

    this.connectionPromise = new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new WebSocket('ws://localhost:8080/ws'),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => {
          console.log('🔍 STOMP Debug:', str);
        },
        onConnect: (frame) => {
          console.log('✅ WebSocket conectado exitosamente!', frame);
          this.connected = true;
          this.connectionPromise = null; // ✅ Limpiar promesa
          resolve();
        },
        onStompError: (frame) => {
          console.error('❌ STOMP error:', frame.headers['message']);
          console.error('❌ Detalles:', frame.body);
          this.connected = false;
          this.connectionPromise = null; // ✅ Limpiar promesa
          reject(new Error(`STOMP error: ${frame.headers['message']}`));
        },
        onWebSocketError: (error) => {
          console.error('❌ WebSocket error:', error);
          this.connected = false;
          this.connectionPromise = null; // ✅ Limpiar promesa
          reject(error);
        },
        onDisconnect: (frame) => {
          console.log('🔌 WebSocket desconectado:', frame);
          this.connected = false;
          this.subscriptions.clear();
          this.connectionPromise = null; // ✅ Limpiar promesa
        },
        onWebSocketClose: (event) => {
          console.log('🔌 WebSocket cerrado:', event);
          this.connected = false;
          this.connectionPromise = null; // ✅ Limpiar promesa
        }
      });

      try {
        this.client.activate();
        console.log('🔄 Cliente WebSocket activado...');
      } catch (error) {
        console.error('❌ Error activando cliente:', error);
        this.connectionPromise = null; // ✅ Limpiar promesa
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    if (this.client && this.connected) {
      console.log('🔌 Desconectando WebSocket...');
      this.subscriptions.forEach((subscription) => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('Error al desuscribirse:', error);
        }
      });
      this.subscriptions.clear();
      this.client.deactivate();
      this.connected = false;
      this.connectionPromise = null;
    }
  }

  // Suscribirse a mensajes de una conversación
  subscribeToConversation(
    idConversacion: number, 
    onMessage: MessageHandler
  ): () => void {
    if (!this.client || !this.connected) {
      throw new Error('WebSocket not connected');
    }

    const topic = API_CONFIG.WEBSOCKET.TOPICS.CONVERSACION(idConversacion);
    const subscriptionKey = `conversation-${idConversacion}`;
    
    // ✅ Evitar suscripciones duplicadas
    if (this.subscriptions.has(subscriptionKey)) {
      console.log('🔄 Ya suscrito a:', topic);
      const existingSubscription = this.subscriptions.get(subscriptionKey);
      return () => {
        existingSubscription.unsubscribe();
        this.subscriptions.delete(subscriptionKey);
      };
    }

    console.log('📡 Suscribiéndose a:', topic);
    
    const subscription = this.client.subscribe(topic, (message) => {
      try {
        console.log('📨 Mensaje WebSocket recibido:', message.body);
        const parsedMessage: Mensaje = JSON.parse(message.body);
        console.log('✅ Mensaje parseado:', parsedMessage);
        onMessage(parsedMessage);
      } catch (error) {
        console.error('❌ Error parsing message:', error, message.body);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);

    // Retornar función para desuscribirse
    return () => {
      console.log('🚫 Desuscribiéndose de:', topic);
      try {
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionKey);
      } catch (error) {
        console.warn('Error al desuscribirse:', error);
      }
    };
  }

  // Suscribirse a notificaciones de "escribiendo"
  subscribeToTyping(
    idConversacion: number, 
    onTyping: TypingHandler
  ): () => void {
    if (!this.client || !this.connected) {
      throw new Error('WebSocket not connected');
    }

    const topic = API_CONFIG.WEBSOCKET.TOPICS.TYPING(idConversacion);
    const subscriptionKey = `typing-${idConversacion}`;
    
    // ✅ Evitar suscripciones duplicadas
    if (this.subscriptions.has(subscriptionKey)) {
      console.log('🔄 Ya suscrito a typing:', topic);
      const existingSubscription = this.subscriptions.get(subscriptionKey);
      return () => {
        existingSubscription.unsubscribe();
        this.subscriptions.delete(subscriptionKey);
      };
    }

    console.log('⌨️ Suscribiéndose a typing:', topic);
    
    const subscription = this.client.subscribe(topic, (message) => {
      try {
        const userId: number = JSON.parse(message.body);
        console.log('⌨️ Usuario escribiendo:', userId);
        onTyping(userId);
      } catch (error) {
        console.error('❌ Error parsing typing notification:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);

    return () => {
      try {
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionKey);
      } catch (error) {
        console.warn('Error al desuscribirse de typing:', error);
      }
    };
  }

  // Suscribirse a notificaciones de "leído"
  subscribeToRead(
    idConversacion: number, 
    onRead: ReadHandler
  ): () => void {
    if (!this.client || !this.connected) {
      throw new Error('WebSocket not connected');
    }

    const topic = API_CONFIG.WEBSOCKET.TOPICS.LEIDO(idConversacion);
    const subscriptionKey = `read-${idConversacion}`;
    
    // ✅ Evitar suscripciones duplicadas
    if (this.subscriptions.has(subscriptionKey)) {
      console.log('🔄 Ya suscrito a read:', topic);
      const existingSubscription = this.subscriptions.get(subscriptionKey);
      return () => {
        existingSubscription.unsubscribe();
        this.subscriptions.delete(subscriptionKey);
      };
    }

    const subscription = this.client.subscribe(topic, (message) => {
      try {
        const userId: number = JSON.parse(message.body);
        onRead(userId);
      } catch (error) {
        console.error('❌ Error parsing read notification:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);

    return () => {
      try {
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionKey);
      } catch (error) {
        console.warn('Error al desuscribirse de read:', error);
      }
    };
  }

  // Enviar mensaje por WebSocket
  sendMessage(message: MensajeWebSocketDTO): void {
    if (!this.client || !this.connected) {
      throw new Error('WebSocket not connected');
    }

    console.log('📤 Enviando mensaje por WebSocket:', message);
    
    try {
      this.client.publish({
        destination: API_CONFIG.WEBSOCKET.ENDPOINTS.ENVIAR_MENSAJE,
        body: JSON.stringify(message),
      });
      
      console.log('✅ Mensaje enviado a:', API_CONFIG.WEBSOCKET.ENDPOINTS.ENVIAR_MENSAJE);
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw error;
    }
  }

  // Notificar que el usuario está escribiendo
  sendTypingNotification(typing: UsuarioEscribiendoDTO): void {
    if (!this.client || !this.connected) {
      console.warn('⚠️ WebSocket no conectado, no se puede enviar typing notification');
      return;
    }

    try {
      this.client.publish({
        destination: API_CONFIG.WEBSOCKET.ENDPOINTS.TYPING,
        body: JSON.stringify(typing),
      });
    } catch (error) {
      console.error('❌ Error enviando typing notification:', error);
    }
  }

  // Marcar mensajes como leídos por WebSocket
  markAsRead(request: MarcarLeidosRequest): void {
    if (!this.client || !this.connected) {
      console.warn('⚠️ WebSocket no conectado, no se puede marcar como leído');
      return;
    }

    try {
      this.client.publish({
        destination: API_CONFIG.WEBSOCKET.ENDPOINTS.LEER_MENSAJES,
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('❌ Error marcando como leído:', error);
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }
}

export const websocketService = new WebSocketService();