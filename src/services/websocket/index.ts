import { WebSocketConnection } from './WebSocketConnection';
import { SubscriptionManager } from './SubscriptionManager';
import { MessagePublisher } from './MessagePublisher';
import type { MessageHandler, TypingHandler, ReadHandler } from './types';

export type { MessageHandler, TypingHandler, ReadHandler };

class WebSocketService {
  private connection: WebSocketConnection;
  private subscriptionManager: SubscriptionManager;
  private messagePublisher: MessagePublisher;

  constructor() {
    this.connection = new WebSocketConnection();
    this.subscriptionManager = new SubscriptionManager(() => this.connection.getClient());
    this.messagePublisher = new MessagePublisher(() => this.connection.getClient());
  }

  // ✅ MÉTODOS DE CONEXIÓN
  connect(): Promise<void> {
    return this.connection.connect();
  }

  disconnect(): void {
    this.subscriptionManager.clearAllSubscriptions();
    this.connection.disconnect();
  }

  isConnected(): boolean {
    return this.connection.isConnected();
  }

  // ✅ MÉTODOS DE SUSCRIPCIÓN
  subscribeToConversation(
    idConversacion: number, 
    onMessage: MessageHandler
  ): () => void {
    return this.subscriptionManager.subscribeToConversation(idConversacion, onMessage);
  }

  subscribeToTyping(
    idConversacion: number, 
    onTyping: TypingHandler
  ): () => void {
    return this.subscriptionManager.subscribeToTyping(idConversacion, onTyping);
  }

  subscribeToRead(
    idConversacion: number, 
    onRead: ReadHandler
  ): () => void {
    return this.subscriptionManager.subscribeToRead(idConversacion, onRead);
  }

  // ✅ MÉTODOS DE PUBLICACIÓN
  sendMessage(message: any): void {
    this.messagePublisher.sendMessage(message);
  }

  sendTypingNotification(typing: any): void {
    this.messagePublisher.sendTypingNotification(typing);
  }

  markAsRead(request: any): void {
    this.messagePublisher.markAsRead(request);
  }
}

export const websocketService = new WebSocketService();