import type { 
  ConversacionResumenDTO, 
  Mensaje, 
  MensajeDTO,
  Usuario,
  ChatUser, 
  ChatMessage, 
  ChatConversation 
} from '../types/api';
import { getAvatarForUser, mapBackendRoleToFrontend } from '../constants/avatars.js';

// ✅ TRANSFORMAR Usuario del backend a ChatUser del frontend
export const transformUsuarioToChatUser = (usuario: Usuario): ChatUser => {
  return {
    id: usuario.id,
    name: usuario.nombre, // ✅ USAR NOMBRE REAL DEL BACKEND
    email: usuario.email,
    avatar: getAvatarForUser(usuario.id), // ✅ ASIGNAR AVATAR BASADO EN ID
    role: 'colaborador', // ✅ DEFAULT - se actualizará con datos reales si están disponibles
    status: 'online',
    expertise: []
  };
};

// ✅ TRANSFORMAR Usuario con información completa (cuando tenemos rol)
export const transformUsuarioCompletoToChatUser = (
  id: number, 
  nombre: string, 
  email: string, 
  role?: string
): ChatUser => {
  return {
    id,
    name: nombre, // ✅ NOMBRE REAL DEL BACKEND
    email,
    avatar: getAvatarForUser(id), // ✅ AVATAR CONSISTENTE BASADO EN ID
    role: role ? mapBackendRoleToFrontend(role) : 'colaborador',
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

  // ✅ USAR DATOS REALES DEL BACKEND
  const emisor: Usuario = {
    id: mensajeDTO.emisorId,
    nombre: mensajeDTO.emisorNombre, // ✅ NOMBRE REAL
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

// ✅ ARREGLO CRÍTICO: Transformar mensaje WebSocket con estructura real
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
      nombre: mensaje.emisor.nombre || mensaje.emisor.name, // ✅ FLEXIBILIDAD EN NOMBRES
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

// ✅ TRANSFORMAR ConversacionResumenDTO a ChatConversation CON DATOS REALES
export const transformConversacionResumenToChatConversation = (
  resumen: ConversacionResumenDTO,
  currentUserId: number
): ChatConversation => {
  
  // ✅ CREAR USUARIO ACTUAL - Solo necesitamos ID para identificación
  const currentUser: ChatUser = {
    id: currentUserId,
    name: 'Tú', // ✅ MANTENER "Tú" para identificar al usuario actual
    email: '',
    avatar: getAvatarForUser(currentUserId),
    role: 'colaborador', // ✅ Se actualizará con datos reales si están disponibles
    status: 'online'
  };

  // ✅ CREAR OTRO USUARIO CON DATOS REALES DEL BACKEND
  const otherUser: ChatUser = {
    id: resumen.idOtroUsuario,
    name: resumen.nombreOtroUsuario, // ✅ NOMBRE REAL DEL BACKEND
    email: resumen.emailOtroUsuario, // ✅ EMAIL REAL DEL BACKEND
    avatar: getAvatarForUser(resumen.idOtroUsuario), // ✅ AVATAR CONSISTENTE
    role: 'colaborador', // ✅ DEFAULT - se puede mejorar si el backend envía el rol
    status: 'online'
  };

  // ✅ DETERMINAR QUIÉN ENVIÓ EL ÚLTIMO MENSAJE
  // Por ahora asumimos que viene del otro usuario, pero se puede mejorar
  const lastMessageSenderId = resumen.idOtroUsuario;
  
  const lastMessage: ChatMessage = {
    id: 0, // ✅ ID temporal para último mensaje
    senderId: lastMessageSenderId,
    content: resumen.ultimoMensaje,
    timestamp: new Date(resumen.timestampUltimoMensaje),
    type: 'text',
    status: 'read',
    sender: lastMessageSenderId === currentUserId ? currentUser : otherUser
  };

  return {
    id: resumen.idConversacion,
    participants: [currentUser, otherUser], // ✅ AMBOS USUARIOS
    lastMessage,
    unreadCount: resumen.mensajesNoLeidos,
    updatedAt: new Date(resumen.timestampUltimoMensaje),
    title: resumen.nombreOtroUsuario, // ✅ NOMBRE REAL DEL OTRO USUARIO
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