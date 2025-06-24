// Configuración de la API
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080',
  ENDPOINTS: {
    // Conversaciones
    CONVERSACIONES: '/api/conversaciones',
    CONVERSACIONES_USUARIO: (idUsuario: number) => `/api/conversaciones/usuario/${idUsuario}`,
    CONVERSACIONES_RESUMEN: (idUsuario: number) => `/api/conversaciones/resumen/${idUsuario}`,
    
    // Mensajes
    MENSAJES: '/api/mensajes',
    MENSAJES_CONVERSACION: (idConversacion: number) => `/api/mensajes/conversacion/${idConversacion}`,
    // ✅ NUEVO: Endpoint de paginación
    MENSAJES_PAGINADO: (idConversacion: number) => `/api/mensajes/conversacion/${idConversacion}/paginado`,
    MENSAJES_LEER: '/api/mensajes/leer',
  },
  WEBSOCKET: {
    URL: 'ws://localhost:8080/ws',
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