// ✅ CONFIGURACIÓN PARA PRODUCCIÓN
export const API_CONFIG = {
  // ✅ DETECTAR AUTOMÁTICAMENTE EL ENTORNO
  BASE_URL: import.meta.env.PROD 
    ? 'https://skill-link-emprendedor-pjof.onrender.com'  // ✅ TU BACKEND DESPLEGADO
    : 'http://localhost:8080',  // ✅ DESARROLLO LOCAL
    
  ENDPOINTS: {
    // Conversaciones
    CONVERSACIONES: '/api/conversaciones',
    CONVERSACIONES_USUARIO: (idUsuario: number) => `/api/conversaciones/usuario/${idUsuario}`,
    CONVERSACIONES_RESUMEN: (idUsuario: number) => `/api/conversaciones/resumen/${idUsuario}`,
    
    // Mensajes
    MENSAJES: '/api/mensajes',
    MENSAJES_CONVERSACION: (idConversacion: number) => `/api/mensajes/conversacion/${idConversacion}`,
    MENSAJES_PAGINADO: (idConversacion: number) => `/api/mensajes/conversacion/${idConversacion}/paginado`,
    MENSAJES_LEER: '/api/mensajes/leer',
  },
  WEBSOCKET: {
    // ✅ WEBSOCKET URL DINÁMICA
    URL: import.meta.env.PROD 
      ? 'wss://skill-link-emprendedor-pjof.onrender.com/ws'  // ✅ WSS para HTTPS
      : 'ws://localhost:8080/ws',  // ✅ WS para desarrollo
      
    ENDPOINTS: {
      ENVIAR_MENSAJE: '/app/chat.enviarMensaje',
      TYPING: '/app/chat.typing',
      LEER_MENSAJES: '/app/chat.leerMensajes',
    },
    TOPICS: {
      CONVERSACION: (idConversacion: number) => `/topic/conversacion/${idConversacion}`,
      TYPING: (idConversacion: number) => `/topic/conversacion/${idConversacion}/typing`,
      LEIDO: (idConversacion: number) => `/topic/conversacion/${idConversacion}/leido`,
    }
  }
};

// ✅ FUNCIÓN HELPER PARA DEBUGGING
export const getApiInfo = () => {
  console.log('🔧 Configuración API:', {
    environment: import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT',
    baseUrl: API_CONFIG.BASE_URL,
    websocketUrl: API_CONFIG.WEBSOCKET.URL,
    mode: import.meta.env.MODE
  });
};