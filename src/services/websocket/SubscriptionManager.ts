import { Client } from '@stomp/stompjs';
import { API_CONFIG } from '../../config/api';
import type { MessageHandler, TypingHandler, ReadHandler } from './types';

export class SubscriptionManager {
  private subscriptions = new Map<string, any>();

  constructor(private getClient: () => Client | null) {}

  subscribeToConversation(
    idConversacion: number, 
    onMessage: MessageHandler
  ): () => void {
    const client = this.getClient();
    if (!client) {
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
    
    const subscription = client.subscribe(topic, (message) => {
      try {
        console.log('📨 Mensaje WebSocket recibido:', message.body);
        const parsedMessage = JSON.parse(message.body);
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
    const client = this.getClient();
    if (!client) {
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
    
    const subscription = client.subscribe(topic, (message) => {
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
    const client = this.getClient();
    if (!client) {
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

    const subscription = client.subscribe(topic, (message) => {
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

  clearAllSubscriptions(): void {
    console.log('🧹 Limpiando todas las suscripciones...');
    this.subscriptions.forEach((subscription) => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.warn('Error al desuscribirse:', error);
      }
    });
    this.subscriptions.clear();
  }
}