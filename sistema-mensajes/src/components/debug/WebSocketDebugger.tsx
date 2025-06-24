import React, { useState, useEffect } from 'react';
import { websocketService } from '../../services/websocketService';
import { apiService } from '../../services/apiService';

export const WebSocketDebugger: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [wsStatus, setWsStatus] = useState<string>('Desconectado');
  const [testResults, setTestResults] = useState<any>({});

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  // Test 1: Verificar conexión WebSocket
  const testWebSocketConnection = async () => {
    addLog('🔍 INICIANDO TEST DE WEBSOCKET...');
    
    try {
      addLog('🚀 Intentando conectar WebSocket...');
      await websocketService.connect();
      
      if (websocketService.isConnected()) {
        addLog('✅ WebSocket conectado exitosamente');
        setWsStatus('Conectado');
        setTestResults((prev: any) => ({ ...prev, websocket: 'SUCCESS' }));
      } else {
        addLog('❌ WebSocket no pudo conectar');
        setWsStatus('Error');
        setTestResults((prev: any) => ({ ...prev, websocket: 'FAILED' }));
      }
    } catch (error) {
      addLog(`❌ Error en WebSocket: ${error}`);
      setWsStatus('Error');
      setTestResults((prev: any) => ({ ...prev, websocket: 'FAILED' }));
    }
  };

  // Test 2: Verificar API REST
  const testRestAPI = async () => {
    addLog('🔍 INICIANDO TEST DE API REST...');
    
    try {
      addLog('📡 Probando endpoint de conversaciones...');
      const conversations = await apiService.listarResumenesConversaciones(1);
      addLog(`✅ API REST funcionando - ${conversations.length} conversaciones encontradas`);
      setTestResults((prev: any) => ({ ...prev, api: 'SUCCESS', conversationCount: conversations.length }));
    } catch (error) {
      addLog(`❌ Error en API REST: ${error}`);
      setTestResults((prev: any) => ({ ...prev, api: 'FAILED' }));
    }
  };

  // Test 3: Verificar backend
  const testBackendHealth = async () => {
    addLog('🔍 INICIANDO TEST DE BACKEND...');
    
    try {
      addLog('🏥 Verificando salud del backend...');
      const response = await fetch('http://localhost:8080/api/conversaciones/resumen/1');
      
      if (response.ok) {
        addLog('✅ Backend respondiendo correctamente');
        setTestResults((prev: any) => ({ ...prev, backend: 'SUCCESS' }));
      } else {
        addLog(`❌ Backend error: ${response.status} ${response.statusText}`);
        setTestResults((prev: any) => ({ ...prev, backend: 'FAILED' }));
      }
    } catch (error) {
      addLog(`❌ Backend no accesible: ${error}`);
      setTestResults((prev: any) => ({ ...prev, backend: 'FAILED' }));
    }
  };

  // Test 4: Verificar endpoint WebSocket
  const testWebSocketEndpoint = async () => {
    addLog('🔍 INICIANDO TEST DE ENDPOINT WEBSOCKET...');
    
    try {
      // Intentar conectar directamente al endpoint
      const ws = new WebSocket('ws://localhost:8080/ws');
      
      ws.onopen = () => {
        addLog('✅ Endpoint WebSocket /ws accesible');
        setTestResults((prev: any) => ({ ...prev, wsEndpoint: 'SUCCESS' }));
        ws.close();
      };
      
      ws.onerror = (error) => {
        addLog(`❌ Error en endpoint WebSocket: ${error}`);
        setTestResults((prev: any) => ({ ...prev, wsEndpoint: 'FAILED' }));
      };
      
      ws.onclose = (event) => {
        if (event.code !== 1000) {
          addLog(`❌ WebSocket cerrado inesperadamente: ${event.code} ${event.reason}`);
        }
      };
      
      // Timeout después de 5 segundos
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          addLog('❌ Timeout conectando a WebSocket endpoint');
          setTestResults((prev: any) => ({ ...prev, wsEndpoint: 'TIMEOUT' }));
          ws.close();
        }
      }, 5000);
      
    } catch (error) {
      addLog(`❌ Error creando WebSocket: ${error}`);
      setTestResults((prev: any) => ({ ...prev, wsEndpoint: 'FAILED' }));
    }
  };

  // Test 5: Enviar mensaje de prueba
  const testSendMessage = async () => {
    addLog('🔍 INICIANDO TEST DE ENVÍO DE MENSAJE...');
    
    if (!websocketService.isConnected()) {
      addLog('❌ WebSocket no conectado - no se puede enviar mensaje');
      return;
    }
    
    try {
      // Suscribirse a la conversación 1 para recibir el mensaje
      const unsubscribe = websocketService.subscribeToConversation(1, (mensaje) => {
        addLog(`📨 MENSAJE RECIBIDO: ${mensaje.contenido}`);
        setTestResults((prev: any) => ({ ...prev, messageReceived: 'SUCCESS' }));
        unsubscribe();
      });
      
      // Enviar mensaje de prueba
      const testMessage = {
        idConversacion: 1,
        idEmisor: 1,
        contenido: `Mensaje de prueba - ${new Date().toISOString()}`
      };
      
      addLog('📤 Enviando mensaje de prueba...');
      websocketService.sendMessage(testMessage);
      addLog('✅ Mensaje enviado por WebSocket');
      setTestResults((prev: any) => ({ ...prev, messageSent: 'SUCCESS' }));
      
    } catch (error) {
      addLog(`❌ Error enviando mensaje: ${error}`);
      setTestResults((prev: any) => ({ ...prev, messageSent: 'FAILED' }));
    }
  };

  // Ejecutar todos los tests
  const runAllTests = async () => {
    setLogs([]);
    setTestResults({});
    
    addLog('🚀 INICIANDO DIAGNÓSTICO COMPLETO...');
    addLog('='.repeat(50));
    
    await testBackendHealth();
    addLog('');
    
    await testWebSocketEndpoint();
    addLog('');
    
    await testRestAPI();
    addLog('');
    
    await testWebSocketConnection();
    addLog('');
    
    if (websocketService.isConnected()) {
      await testSendMessage();
    }
    
    addLog('='.repeat(50));
    addLog('🏁 DIAGNÓSTICO COMPLETADO');
  };

  // Limpiar logs
  const clearLogs = () => {
    setLogs([]);
    setTestResults({});
  };

  // Auto-ejecutar tests al montar
  useEffect(() => {
    runAllTests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      case 'TIMEOUT': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🔧 Diagnóstico WebSocket</h2>
        <p className="text-gray-600">Herramienta de diagnóstico para identificar problemas de conexión</p>
      </div>

      {/* Estado actual */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Estado Actual:</h3>
        <div className="flex items-center gap-2">
          <span className="font-medium">WebSocket:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            wsStatus === 'Conectado' ? 'bg-green-100 text-green-700' : 
            wsStatus === 'Error' ? 'bg-red-100 text-red-700' : 
            'bg-gray-100 text-gray-700'
          }`}>
            {wsStatus}
          </span>
        </div>
      </div>

      {/* Resultados de tests */}
      {Object.keys(testResults).length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Resultados de Tests:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(testResults).map(([test, result]) => (
              <div key={test} className={`px-3 py-2 rounded text-sm ${getStatusColor(result as string)}`}>
                <div className="font-medium">{test}</div>
                <div className="text-xs">{result as string}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={runAllTests}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          🔄 Ejecutar Tests
        </button>
        <button
          onClick={testWebSocketConnection}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          🔌 Test WebSocket
        </button>
        <button
          onClick={testSendMessage}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          disabled={!websocketService.isConnected()}
        >
          📤 Test Mensaje
        </button>
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          🗑️ Limpiar
        </button>
      </div>

      {/* Logs */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
        <div className="mb-2 text-green-300">🖥️ Console de Diagnóstico:</div>
        {logs.length === 0 ? (
          <div className="text-gray-500">Ejecuta los tests para ver los logs...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
      </div>

      {/* Información de configuración */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Configuración Actual:</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div><strong>WebSocket URL:</strong> ws://localhost:8080/ws</div>
          <div><strong>API Base URL:</strong> http://localhost:8080</div>
          <div><strong>Usuario ID:</strong> 1</div>
          <div><strong>Protocolo:</strong> STOMP sobre WebSocket nativo</div>
        </div>
      </div>
    </div>
  );
};