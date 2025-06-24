import { useEffect, useRef, useState } from 'react';
import { websocketService, type MessageHandler, type TypingHandler, type ReadHandler } from '../services/websocketService';

export const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const connectionAttempted = useRef(false);
  const isConnecting = useRef(false);

  useEffect(() => {
    // ✅ Evitar múltiples conexiones en React StrictMode
    if (connectionAttempted.current || isConnecting.current) {
      console.log('🔄 Conexión ya iniciada, saltando...');
      return;
    }
    
    connectionAttempted.current = true;
    isConnecting.current = true;
    setConnecting(true);

    console.log('🚀 Iniciando conexión WebSocket única...');

    websocketService.connect()
      .then(() => {
        console.log('✅ WebSocket conectado exitosamente');
        setConnected(true);
        setConnecting(false);
        isConnecting.current = false;
      })
      .catch((error) => {
        console.warn('❌ WebSocket connection failed:', error);
        setConnecting(false);
        setConnected(false);
        isConnecting.current = false;
        // ✅ Permitir reintentos en caso de error
        connectionAttempted.current = false;
      });

    // ✅ Cleanup solo si realmente necesitamos desconectar
    return () => {
      // Solo desconectar si el componente se desmonta completamente
      console.log('🧹 Cleanup de useWebSocket');
    };
  }, []); // ✅ Array de dependencias vacío para ejecutar solo una vez

  // ✅ Cleanup global cuando la aplicación se cierra
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🔌 Desconectando WebSocket al cerrar aplicación');
      websocketService.disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return { connected, connecting };
};

export const useConversationSubscription = (
  idConversacion: number | null,
  onMessage: MessageHandler,
  onTyping?: TypingHandler,
  onRead?: ReadHandler
) => {
  const unsubscribeRefs = useRef<(() => void)[]>([]);
  const currentConversationId = useRef<number | null>(null);

  useEffect(() => {
    // ✅ VALIDACIÓN CORREGIDA: Manejar correctamente null
    console.log('🔍 Validando parámetros de suscripción:', {
      idConversacion,
      type: typeof idConversacion,
      isNull: idConversacion === null,
      isUndefined: idConversacion === undefined,
      isNumber: typeof idConversacion === 'number',
      isPositive: typeof idConversacion === 'number' && idConversacion > 0
    });

    // ✅ CORRECCIÓN: Verificar explícitamente null y undefined
    if (idConversacion === null || idConversacion === undefined) {
      console.log('⏸️ No se puede suscribir - ID de conversación es null/undefined');
      return;
    }

    if (typeof idConversacion !== 'number') {
      console.log('⏸️ No se puede suscribir - ID de conversación no es número:', {
        idConversacion,
        type: typeof idConversacion
      });
      return;
    }

    if (idConversacion <= 0) {
      console.log('⏸️ No se puede suscribir - ID de conversación no es positivo:', idConversacion);
      return;
    }

    if (!websocketService.isConnected()) {
      console.log('⏸️ No se puede suscribir - WebSocket no conectado');
      return;
    }

    if (!onMessage || typeof onMessage !== 'function') {
      console.log('⏸️ No se puede suscribir - onMessage no es una función válida');
      return;
    }

    // ✅ Evitar suscripciones duplicadas
    if (currentConversationId.current === idConversacion) {
      console.log('🔄 Ya suscrito a conversación:', idConversacion);
      return;
    }

    // Limpiar suscripciones anteriores
    console.log('🧹 Limpiando suscripciones anteriores...');
    unsubscribeRefs.current.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error al desuscribirse:', error);
      }
    });
    unsubscribeRefs.current = [];

    currentConversationId.current = idConversacion;

    try {
      console.log('📡 Iniciando suscripciones para conversación:', idConversacion);

      // Suscribirse a mensajes
      const unsubscribeMessages = websocketService.subscribeToConversation(
        idConversacion, 
        onMessage
      );
      unsubscribeRefs.current.push(unsubscribeMessages);
      console.log('✅ Suscrito a mensajes');

      // Suscribirse a typing si se proporciona handler
      if (onTyping && typeof onTyping === 'function') {
        const unsubscribeTyping = websocketService.subscribeToTyping(
          idConversacion, 
          onTyping
        );
        unsubscribeRefs.current.push(unsubscribeTyping);
        console.log('✅ Suscrito a typing');
      }

      // Suscribirse a read si se proporciona handler
      if (onRead && typeof onRead === 'function') {
        const unsubscribeRead = websocketService.subscribeToRead(
          idConversacion, 
          onRead
        );
        unsubscribeRefs.current.push(unsubscribeRead);
        console.log('✅ Suscrito a read');
      }

      console.log('🎉 Todas las suscripciones completadas para conversación:', idConversacion);
    } catch (error) {
      console.error('❌ Error subscribing to conversation:', error);
      // Limpiar en caso de error
      unsubscribeRefs.current.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (cleanupError) {
          console.warn('Error en cleanup después de error:', cleanupError);
        }
      });
      unsubscribeRefs.current = [];
      currentConversationId.current = null;
    }

    return () => {
      console.log('🧹 Limpiando suscripciones para conversación:', idConversacion);
      unsubscribeRefs.current.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error al desuscribirse en cleanup:', error);
        }
      });
      unsubscribeRefs.current = [];
      currentConversationId.current = null;
    };
  }, [idConversacion, onMessage, onTyping, onRead]);
};