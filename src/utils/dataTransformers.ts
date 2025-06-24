import type { 
  ConversacionResumenDTO, 
  Mensaje, 
  MensajeDTO,
  Usuario,
  ChatUser, 
  ChatMessage, 
  ChatConversation 
} from '../types/api';

// ✅ ARREGLO: Especificar tipos exactos para role
const TEST_USERS = [
  { id: 1, name: 'Ana Torres', role: 'mentor' as const, avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
  { id: 2, name: 'Jose Perez', role: 'colaborador' as const, avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
  { id: 3, name: 'Luisa Gomez', role: 'mentor' as const, avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
  { id: 4, name: 'Marco Diaz', role: 'colaborador' as const, avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
];

// ✅ FUNCIÓN para obtener datos de usuario por ID
const getUserById = (userId: number): { name: string; avatar: string; role: 'mentor' | 'colaborador' } => {
  const user = TEST_USERS.find(u => u.id === userId);
  return user || { 
    name: `Usuario ${userId}`, 
    avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    role: 'colaborador' as const
  };
};

// Transformar Usuario del backend a ChatUser del frontend
export const transformUsuarioToChatUser = (usuario: Usuario): ChatUser => {
  const userData = getUserById(usuario.id);
  
  return {
    id: usuario.id,
    name: userData.name, // ✅ USAR NOMBRE REAL, NO "Tú"
    email: usuario.email,
    avatar: userData.avatar,
    role: userData.role,
    status: 'online',
    expertise: []
  };
};

// ✅ Transformar MensajeDTO del backend a ChatMessage del frontend
export const transformMensajeDTOToChatMessage = (mensajeDTO: MensajeDTO): ChatMessage => {
  if (!mensajeDTO || typeof mensajeDTO.id === 'undefined') {
    console.error('MensajeDTO inválido:', mensajeDTO);
    throw new Error('MensajeDTO sin ID válido');
  }

  const emisor: Usuario = {
    id: mensajeDTO.emisorId,
    nombre: mensajeDTO.emisorNombre,
    email: mensajeDTO.emisorEmail
  };

  return {
    id: mensajeDTO.id,
    senderId: mensajeDTO.emisorId,
    content: mensajeDTO.contenido || '',
    timestamp: new Date(mensajeDTO.timestampEnvio),
    type: 'text',
    status: mensajeDTO.leido ? 'read' : 'delivered',
    sender: transformUsuarioToChatUser(emisor)
  };
};

// ✅ NUEVO: Interfaz para el mensaje completo que viene del backend
interface MensajeCompletoWebSocket {
  id: number;
  contenido: string;
  leido: boolean;
  timestampEnvio: string;
  emisor: {
    id: number;
    nombre: string;
    email: string;
  };
}

// ✅ ARREGLO CRÍTICO: Transformar mensaje WebSocket con nueva estructura
export const transformMensajeToChatMessage = (mensaje: any): ChatMessage => {
  console.log('🔄 Transformando mensaje WebSocket:', mensaje);
  
  if (!mensaje || typeof mensaje.id === 'undefined') {
    console.error('❌ Mensaje inválido:', mensaje);
    throw new Error('Mensaje sin ID válido');
  }

  // ✅ DETECTAR ESTRUCTURA: Mensaje completo vs Mensaje simple
  let emisorData: Usuario;
  
  if (mensaje.emisor && mensaje.emisor.id) {
    // ✅ ESTRUCTURA NUEVA: Mensaje completo con emisor
    console.log('✅ Mensaje con emisor completo detectado');
    emisorData = {
      id: mensaje.emisor.id,
      nombre: mensaje.emisor.nombre,
      email: mensaje.emisor.email
    };
  } else {
    // ❌ ESTRUCTURA ANTIGUA: Mensaje sin emisor (fallback)
    console.error('❌ MENSAJE SIN EMISOR VÁLIDO:', mensaje);
    console.error('❌ Emisor recibido:', mensaje.emisor);
    
    // ✅ CREAR EMISOR POR DEFECTO TEMPORAL
    emisorData = {
      id: 0,
      nombre: 'Usuario Desconocido',
      email: 'unknown@example.com'
    };
    
    console.warn('⚠️ Usando emisor por defecto temporal');
  }

  console.log('✅ Emisor procesado:', {
    id: emisorData.id,
    nombre: emisorData.nombre,
    email: emisorData.email
  });

  const chatMessage = {
    id: mensaje.id,
    senderId: emisorData.id,
    content: mensaje.contenido || '',
    timestamp: new Date(mensaje.timestampEnvio),
    type: 'text' as const,
    status: mensaje.leido ? 'read' as const : 'delivered' as const,
    sender: transformUsuarioToChatUser(emisorData)
  };

  console.log('✅ Mensaje transformado exitosamente:', {
    id: chatMessage.id,
    senderId: chatMessage.senderId,
    senderName: chatMessage.sender.name
  });

  return chatMessage;
};

// ✅ ARREGLO CRÍTICO: Transformar ConversacionResumenDTO a ChatConversation
export const transformConversacionResumenToChatConversation = (
  resumen: ConversacionResumenDTO,
  currentUserId: number
): ChatConversation => {
  // ✅ CREAR USUARIO ACTUAL CON NOMBRE REAL
  const currentUserData = getUserById(currentUserId);
  const currentUser: ChatUser = {
    id: currentUserId,
    name: 'Tú', // ✅ MANTENER "Tú" para identificar al usuario actual en notificaciones
    email: '',
    avatar: currentUserData.avatar,
    role: currentUserData.role,
    status: 'online'
  };

  // ✅ CREAR OTRO USUARIO CON DATOS REALES
  const otherUserData = getUserById(resumen.idOtroUsuario);
  const otherUser: ChatUser = {
    id: resumen.idOtroUsuario,
    name: otherUserData.name, // ✅ USAR NOMBRE REAL DEL OTRO USUARIO
    email: resumen.emailOtroUsuario,
    avatar: otherUserData.avatar,
    role: otherUserData.role,
    status: 'online'
  };

  // ✅ DETERMINAR QUIÉN ENVIÓ EL ÚLTIMO MENSAJE
  const lastMessageSenderId = resumen.idOtroUsuario; // Asumimos que viene del otro usuario por defecto
  
  const lastMessage: ChatMessage = {
    id: 0,
    senderId: lastMessageSenderId,
    content: resumen.ultimoMensaje,
    timestamp: new Date(resumen.timestampUltimoMensaje),
    type: 'text',
    status: 'read',
    sender: lastMessageSenderId === currentUserId ? currentUser : otherUser
  };

  return {
    id: resumen.idConversacion,
    // ✅ CRÍTICO: INCLUIR AMBOS USUARIOS PARA QUE EL FRONTEND PUEDA IDENTIFICAR AL "OTRO"
    participants: [currentUser, otherUser],
    lastMessage,
    unreadCount: resumen.mensajesNoLeidos,
    updatedAt: new Date(resumen.timestampUltimoMensaje),
    // ✅ CRÍTICO: EL TÍTULO DEBE SER EL NOMBRE DEL OTRO USUARIO
    title: otherUserData.name,
    type: 'direct'
  };
};

// ✅ Transformar array de MensajeDTO con manejo de errores
export const transformMensajesDTOToChatMessages = (mensajesDTO: MensajeDTO[]): ChatMessage[] => {
  if (!Array.isArray(mensajesDTO)) {
    console.error('Los mensajes no son un array:', mensajesDTO);
    return [];
  }

  return mensajesDTO
    .filter(mensajeDTO => mensajeDTO && typeof mensajeDTO.id !== 'undefined')
    .map(mensajeDTO => {
      try {
        return transformMensajeDTOToChatMessage(mensajeDTO);
      } catch (error) {
        console.error('Error transformando mensajeDTO:', mensajeDTO, error);
        return null;
      }
    })
    .filter((mensaje): mensaje is ChatMessage => mensaje !== null);
};

// ✅ Transformar array de mensajes con manejo de errores
export const transformMensajesToChatMessages = (mensajes: Mensaje[]): ChatMessage[] => {
  if (!Array.isArray(mensajes)) {
    console.error('Los mensajes no son un array:', mensajes);
    return [];
  }

  return mensajes
    .filter(mensaje => mensaje && typeof mensaje.id !== 'undefined')
    .map(mensaje => {
      try {
        return transformMensajeToChatMessage(mensaje);
      } catch (error) {
        console.error('Error transformando mensaje:', mensaje, error);
        return null;
      }
    })
    .filter((mensaje): mensaje is ChatMessage => mensaje !== null);
};