import { Client } from '@stomp/stompjs';
import { API_CONFIG } from '../../config/api';

export class WebSocketConnection {
  private client: Client | null = null;
  private connected = false;
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

    // ✅ USAR URL DINÁMICA DESDE CONFIG
    const wsUrl = API_CONFIG.WEBSOCKET.URL;
    console.log('🚀 Iniciando nueva conexión WebSocket...');
    console.log('🔗 URL:', wsUrl);

    this.connectionPromise = new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => {
          const ws = new WebSocket(wsUrl);
          
          // ✅ Logs detallados para debugging
          ws.onopen = () => console.log('🔌 WebSocket nativo conectado a:', wsUrl);
          ws.onerror = (error) => console.error('❌ WebSocket nativo error:', error);
          ws.onclose = (event) => console.log('🔌 WebSocket nativo cerrado:', event.code, event.reason);
          
          return ws;
        },
        
        // ✅ CONFIGURACIÓN MEJORADA PARA PRODUCCIÓN
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        
        // ✅ TIMEOUT MÁS LARGO PARA CONEXIONES LENTAS
        connectionTimeout: 15000,
        
        debug: (str) => {
          // ✅ Solo logs importantes en producción
          if (!import.meta.env.PROD || str.includes('ERROR') || str.includes('CONNECT')) {
            console.log('🔍 STOMP:', str);
          }
        },
        
        onConnect: (frame) => {
          console.log('✅ STOMP conectado exitosamente a:', wsUrl);
          this.connected = true;
          this.reconnectAttempts = 0;
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
          this.handleReconnection(reject, error);
        },
        
        onDisconnect: (frame) => {
          console.log('🔌 STOMP desconectado:', frame);
          this.connected = false;
          this.connectionPromise = null;
        },
        
        onWebSocketClose: (event) => {
          console.log('🔌 WebSocket cerrado:', event.code, event.reason);
          this.connected = false;
          this.connectionPromise = null;
          
          // ✅ RECONEXIÓN AUTOMÁTICA si no fue cierre intencional
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.handleAutoReconnection();
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

  private handleReconnection(reject: (reason?: any) => void, error: any) {
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
  }

  private handleAutoReconnection() {
    this.reconnectAttempts++;
    console.log(`🔄 Reconexión automática ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    setTimeout(() => {
      this.connectionPromise = null;
      this.connect();
    }, 3000);
  }

  disconnect(): void {
    if (this.client && this.connected) {
      console.log('🔌 Desconectando WebSocket...');
      this.client.deactivate();
      this.connected = false;
      this.connectionPromise = null;
      this.reconnectAttempts = 0;
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  getClient(): Client | null {
    return this.client;
  }
}