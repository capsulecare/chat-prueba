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
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

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
        // ✅ CONFIGURACIÓN MEJORADA
        webSocketFactory: () => {
          const ws = new WebSocket('ws://localhost:8080/ws');
          
          // ✅ Logs detallados para debugging
          ws.onopen = () => console.log('🔌 WebSocket nativo conectado');
          ws.onerror = (error) => console.error('❌ WebSocket nativo error:', error);
          ws.onclose = (event) => console.log('🔌 WebSocket nativo cerrado:', event.code, event.reason);
          
          return ws;
        },
        
        // ✅ CONFIGURACIÓN DE RECONEXIÓN MEJORADA
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        
        // ✅ CONFIGURACIÓN DE TIMEOUTS
        connectionTimeout: 10000,
        
        debug: (str) => {
          console.log('🔍 STOMP Debug:', str);
        },
        
        onConnect: (frame) => {
          console.log('✅ STOMP conectado exitosamente!', frame);
          this.connected = true;
          this.reconnectAttempts = 0; // ✅ Reset contador
          this.connectionPromise = null;
          resolve();
        },
        
        onStompError: (frame) => {
          console.error('❌ STOMP error:', frame.headers['message']);
          console.error('❌ Detalles:', frame.body);
          this.connected = false;
          this.connectionPromise = null;
          reject(new Error(`STOMP error: ${frame.headers['message']}`));
        },
        
        onWebSocketError: (error) => {
          console.error('❌ WebSocket error:', error);
          this.connected = false;
          this.connectionPromise = null;
          
          // ✅ MANEJO DE RECONEXIÓN
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => {
              this.connectionPromise = null;
              this.connect();
            }, 2000 * this.reconnectAttempts);
          } else {
            console.error('❌ Máximo de intentos de reconexión alcanzado');
            reject(error);
          }
        },
        
        onDisconnect: (frame) => {
          console.log('🔌 STOMP desconectado:', frame);
          this.connected = false;
          this.subscriptions.clear();
          this.connectionPromise = null;
        },
        
        onWebSocketClose: (event) => {
          console.log('🔌 WebSocket cerrado:', event.code, event.reason);
          this.connected = false;
          this.connectionPromise = null;
          
          // ✅ RECONEXIÓN AUTOMÁTICA si no fue cierre intencional
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconexión automática ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => {
              this.connectionPromise = null;
              this.connect();
            }, 3000);
          }
        }
      });

      try {
        console.log('🔄 Activando cliente STOMP...');
        this.client.activate();
      } catch (error) {
        console.error('❌ Error activando cliente:', error);
        this.connectionPromise = null;
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
      this.reconnectAttempts = 0;
    }
  }

  // ✅ RESTO DE MÉTODOS SIN CAMBIOS
  subscribeToConversation(
    idConversacion: number, 
    onMessage: MessageHandler
  ): () => void {
    if (!this.client || !this.connected) {
      throw new Error('WebSocket not connected');
    }

    const topic = API_CONFIG.WEBSOCKET.TOPICS.CONVERSACION(idConversacion);
    const subscriptionKey = `conversation-${idConversacion}`;
    
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

  subscribeToTyping(
    idConversacion: number, 
    onTyping: TypingHandler
  ): () => void {
    if (!this.client || !this.connected) {
      throw new Error('WebSocket not connected');
    }

    const topic = API_CONFIG.WEBSOCKET.TOPICS.TYPING(idConversacion);
    const subscriptionKey = `typing-${idConversacion}`;
    
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

  subscribeToRead(
    idConversacion: number, 
    onRead: ReadHandler
  ): () => void {
    if (!this.client || !this.connected) {
      throw new Error('WebSocket not connected');
    }

    const topic = API_CONFIG.WEBSOCKET.TOPICS.LEIDO(idConversacion);
    const subscriptionKey = `read-${idConversacion}`;
    
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