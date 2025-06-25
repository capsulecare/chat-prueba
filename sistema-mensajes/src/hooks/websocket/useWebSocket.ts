import { useEffect, useRef, useState } from 'react';
import { websocketService } from '../../services/websocket';

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