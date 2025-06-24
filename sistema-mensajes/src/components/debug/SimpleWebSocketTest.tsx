import React, { useState, useEffect } from 'react';
import { websocketService } from '../../services/websocketService';

export const SimpleWebSocketTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[SIMPLE TEST] ${message}`);
  };

  useEffect(() => {
    const checkConnection = () => {
      setConnected(websocketService.isConnected());
    };
    
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  const testBasicConnection = async () => {
    addLog('🔍 INICIANDO TEST BÁSICO...');
    
    try {
      await websocketService.connect();
      addLog('✅ WebSocket conectado');
      
      // Test simple: suscribirse a conversación 1
      addLog('📡 Suscribiéndose a conversación 1...');
      
      const unsubscribe = websocketService.subscribeToConversation(1, (mensaje) => {
        addLog(`📨 MENSAJE RECIBIDO: ${mensaje.contenido}`);
        addLog(`👤 De: ${mensaje.emisor?.nombre || 'Desconocido'}`);
      });
      
      // Enviar mensaje de prueba después de 1 segundo
      setTimeout(() => {
        addLog('📤 Enviando mensaje de prueba...');
        websocketService.sendMessage({
          idConversacion: 1,
          idEmisor: 1,
          contenido: `TEST SIMPLE - ${new Date().toISOString()}`
        });
      }, 1000);
      
      // Desuscribirse después de 10 segundos
      setTimeout(() => {
        unsubscribe();
        addLog('🚫 Desuscrito de conversación 1');
      }, 10000);
      
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">🔧 Test Simple WebSocket</h2>
      
      <div className="mb-4">
        <div className={`inline-block px-3 py-1 rounded text-sm ${
          connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {connected ? '✅ Conectado' : '❌ Desconectado'}
        </div>
      </div>

      <button
        onClick={testBasicConnection}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        🚀 Ejecutar Test Básico
      </button>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500">Ejecuta el test para ver los logs...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))
        )}
      </div>
    </div>
  );
};