import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { websocketService } from '../services/websocketService';
import type { 
  ConversacionResumenDTO, 
  Mensaje, 
  MensajeDTO,
  MensajeWebSocketDTO,
  UsuarioEscribiendoDTO,
  MarcarLeidosRequest,
  ChatConversation,
  ChatMessage
} from '../types/api';
import { 
  transformConversacionResumenToChatConversation,
  transformMensajesDTOToChatMessages,
  transformMensajeToChatMessage
} from '../utils/dataTransformers';

export const useChat = (currentUserId: number) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: number]: ChatMessage[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: number]: number[] }>({});
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  
  // ✅ Estados para paginación
  const [hasMoreMessages, setHasMoreMessages] = useState<{ [conversationId: number]: boolean }>({});
  const [loadingMoreMessages, setLoadingMoreMessages] = useState<{ [conversationId: number]: boolean }>({});
  const [messagePage, setMessagePage] = useState<{ [conversationId: number]: number }>({});

  console.log('🔍 DEBUG useChat - currentUserId recibido:', currentUserId);

  const setActiveConversation = useCallback((conversationId: number | null) => {
    console.log('🎯 Estableciendo conversación activa:', conversationId);
    setActiveConversationId(conversationId);
  }, []);

  // ✅ FUNCIÓN PARA RECARGAR CONVERSACIONES
  const reloadConversations = useCallback(async () => {
    try {
      console.log('🔄 Recargando conversaciones...');
      const conversationsData = await apiService.listarResumenesConversaciones(currentUserId);
      
      const transformedConversations = conversationsData.map(resumen => 
        transformConversacionResumenToChatConversation(resumen, currentUserId)
      );
      
      setConversations(transformedConversations);
      console.log('✅ Conversaciones recargadas:', transformedConversations.length);
    } catch (err) {
      console.error('❌ Error recargando conversaciones:', err);
    }
  }, [currentUserId]);

  // ✅ SUSCRIPCIÓN WEBSOCKET MEJORADA
  useEffect(() => {
    if (!websocketService.isConnected() || conversations.length === 0) {
      return;
    }

    console.log('🔌 Configurando suscripciones WebSocket para conversaciones:', conversations.map(c => c.id));

    const unsubscribeFunctions: (() => void)[] = [];

    conversations.forEach(conversation => {
      try {
        const unsubscribe = websocketService.subscribeToConversation(
          conversation.id,
          async (mensaje: Mensaje) => {
            console.log('📨 MENSAJE RECIBIDO:', mensaje);
            
            const chatMessage = transformMensajeToChatMessage(mensaje);
            console.log('🔄 Mensaje transformado:', chatMessage);
            
            // ✅ VERIFICAR SI LA CONVERSACIÓN EXISTE
            const conversationExists = conversations.some(conv => conv.id === conversation.id);
            
            if (!conversationExists) {
              console.log('🆕 Mensaje de conversación nueva detectado - Recargando conversaciones...');
              // ✅ RECARGAR CONVERSACIONES CUANDO LLEGA MENSAJE DE CONVERSACIÓN NUEVA
              await reloadConversations();
            }
            
            setMessages(prev => {
              const currentMessages = prev[conversation.id] || [];
              
              if (currentMessages.some(m => m.id === chatMessage.id)) {
                console.log('⚠️ Mensaje duplicado ignorado:', chatMessage.id);
                return prev;
              }

              const newMessages = {
                ...prev,
                [conversation.id]: [...currentMessages, chatMessage]
              };

              console.log('✅ Mensajes actualizados:', {
                conversationId: conversation.id,
                totalMessages: newMessages[conversation.id].length,
                newMessageId: chatMessage.id
              });

              return newMessages;
            });

            const isFromOtherUser = chatMessage.senderId !== currentUserId;
            const isChatActive = activeConversationId === conversation.id;
            
            if (isFromOtherUser && isChatActive) {
              console.log('👁️ Auto-marcando mensaje como leído (chat activo)');
              setTimeout(() => {
                markAsRead(conversation.id);
              }, 100);
            }

            setConversations(prevConversations => {
              return prevConversations.map(conv => {
                if (conv.id === conversation.id) {
                  const shouldIncrementUnread = isFromOtherUser && !isChatActive;
                  
                  return {
                    ...conv,
                    lastMessage: chatMessage,
                    updatedAt: chatMessage.timestamp,
                    unreadCount: shouldIncrementUnread ? conv.unreadCount + 1 : conv.unreadCount
                  };
                }
                return conv;
              }).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
            });
          }
        );

        unsubscribeFunctions.push(unsubscribe);
        console.log(`✅ Suscrito a conversación: ${conversation.id}`);
      } catch (error) {
        console.error('❌ Error suscribiéndose a conversación:', conversation.id, error);
      }
    });

    return () => {
      console.log('🧹 Limpiando suscripciones WebSocket');
      unsubscribeFunctions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error en cleanup:', error);
        }
      });
    };
  }, [conversations.length, currentUserId, activeConversationId, reloadConversations]);

  // ✅ SUSCRIPCIÓN GLOBAL PARA NUEVAS CONVERSACIONES
  useEffect(() => {
    if (!websocketService.isConnected()) {
      return;
    }

    console.log('🌐 Configurando suscripción global para nuevas conversaciones...');

    // ✅ SUSCRIBIRSE A UN TOPIC GLOBAL DEL USUARIO
    const globalTopic = `/topic/user/${currentUserId}/new-conversation`;
    
    const unsubscribeGlobal = websocketService.subscribeToConversation(
      0, // ID especial para suscripción global
      async (mensaje: Mensaje) => {
        console.log('🆕 NUEVA CONVERSACIÓN DETECTADA:', mensaje);
        
        // ✅ RECARGAR CONVERSACIONES CUANDO SE DETECTA UNA NUEVA
        await reloadConversations();
        
        // ✅ TAMBIÉN AGREGAR EL MENSAJE A LA NUEVA CONVERSACIÓN
        const chatMessage = transformMensajeToChatMessage(mensaje);
        
        setMessages(prev => ({
          ...prev,
          [mensaje.conversacion?.id || 0]: [chatMessage]
        }));
      }
    );

    return () => {
      console.log('🧹 Limpiando suscripción global');
      unsubscribeGlobal();
    };
  }, [currentUserId, reloadConversations]);

  // Cargar conversaciones
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📥 Cargando conversaciones para usuario:', currentUserId);
      
      const conversationsData = await apiService.listarResumenesConversaciones(currentUserId);
      console.log('✅ Conversaciones recibidas:', conversationsData);
      
      const transformedConversations = conversationsData.map(resumen => 
        transformConversacionResumenToChatConversation(resumen, currentUserId)
      );
      
      console.log('🔄 Conversaciones transformadas:', transformedConversations);
      setConversations(transformedConversations);
    } catch (err) {
      setError('Error al cargar conversaciones');
      console.error('❌ Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // ✅ CARGAR MENSAJES INICIALES (página 0)
  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      setError(null);
      console.log('📥 Cargando mensajes iniciales para conversación:', conversationId);
      
      const mensajesDTO = await apiService.obtenerMensajes(conversationId);
      console.log('✅ Mensajes DTO recibidos:', mensajesDTO);
      
      const transformedMessages = transformMensajesDTOToChatMessages(mensajesDTO);
      console.log('🔄 Mensajes transformados:', transformedMessages);
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: transformedMessages
      }));

      // ✅ Inicializar estados de paginación
      setMessagePage(prev => ({ ...prev, [conversationId]: 0 }));
      setHasMoreMessages(prev => ({ ...prev, [conversationId]: mensajesDTO.length >= 20 }));
      setLoadingMoreMessages(prev => ({ ...prev, [conversationId]: false }));
      
    } catch (err) {
      setError('Error al cargar mensajes');
      console.error('❌ Error loading messages:', err);
    }
  }, []);

  // ✅ CARGAR MÁS MENSAJES (paginación)
  const loadMoreMessages = useCallback(async (conversationId: number, page: number): Promise<ChatMessage[]> => {
    try {
      console.log('📥 Cargando más mensajes - Conversación:', conversationId, 'Página:', page);
      
      setLoadingMoreMessages(prev => ({ ...prev, [conversationId]: true }));
      
      const mensajesDTO = await apiService.obtenerMensajesPaginados(conversationId, page, 20);
      
      if (mensajesDTO.length === 0) {
        setHasMoreMessages(prev => ({ ...prev, [conversationId]: false }));
        return [];
      }
      
      const transformedMessages = transformMensajesDTOToChatMessages(mensajesDTO);
      
      // ✅ AGREGAR MENSAJES AL INICIO (son mensajes más antiguos)
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...transformedMessages, ...(prev[conversationId] || [])]
      }));
      
      // ✅ Actualizar página
      setMessagePage(prev => ({ ...prev, [conversationId]: page }));
      
      // ✅ Verificar si hay más mensajes
      if (mensajesDTO.length < 20) {
        setHasMoreMessages(prev => ({ ...prev, [conversationId]: false }));
      }
      
      return transformedMessages;
      
    } catch (err) {
      console.error('❌ Error loading more messages:', err);
      return [];
    } finally {
      setLoadingMoreMessages(prev => ({ ...prev, [conversationId]: false }));
    }
  }, []);

  // Enviar mensaje por WebSocket
  const sendMessage = useCallback(async (conversationId: number, content: string) => {
    try {
      setError(null);
      console.log('📤 Enviando mensaje por WebSocket:', {
        conversationId,
        content,
        currentUserId,
        wsConnected: websocketService.isConnected()
      });

      const messageDto: MensajeWebSocketDTO = {
        idConversacion: conversationId,
        idEmisor: currentUserId,
        contenido: content
      };

      if (websocketService.isConnected()) {
        console.log('🚀 Enviando por WebSocket:', messageDto);
        websocketService.sendMessage(messageDto);
        console.log('✅ Mensaje enviado por WebSocket');
        
        // ✅ DESPUÉS DE ENVIAR, RECARGAR CONVERSACIONES POR SI ES UNA NUEVA
        setTimeout(async () => {
          await reloadConversations();
        }, 500);
        
      } else {
        console.log('❌ WebSocket no conectado');
        throw new Error('WebSocket no conectado');
      }
    } catch (err) {
      setError('Error al enviar mensaje');
      console.error('❌ Error sending message:', err);
    }
  }, [currentUserId, reloadConversations]);

  // Marcar mensajes como leídos
  const markAsRead = useCallback(async (conversationId: number) => {
    try {
      setError(null);
      console.log('👁️ Marcando mensajes como leídos para conversación:', conversationId);
      
      const request: MarcarLeidosRequest = {
        idConversacion: conversationId,
        idUsuario: currentUserId
      };

      if (websocketService.isConnected()) {
        websocketService.markAsRead(request);
      } else {
        await apiService.marcarMensajesComoLeidos(request);
      }

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (err) {
      setError('Error al marcar mensajes como leídos');
      console.error('Error marking as read:', err);
    }
  }, [currentUserId]);

  // Notificar que está escribiendo
  const sendTypingNotification = useCallback((conversationId: number) => {
    if (websocketService.isConnected()) {
      const typingDto: UsuarioEscribiendoDTO = {
        idConversacion: conversationId,
        idUsuario: currentUserId
      };
      websocketService.sendTypingNotification(typingDto);
    }
  }, [currentUserId]);

  // Manejar notificación de typing
  const handleTypingNotification = useCallback((conversationId: number, userId: number) => {
    if (userId === currentUserId) return;

    setTypingUsers(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), userId]
    }));

    setTimeout(() => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter(id => id !== userId)
      }));
    }, 3000);
  }, [currentUserId]);

  // Cargar conversaciones al montar
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    messages,
    loading,
    error,
    typingUsers,
    activeConversationId,
    currentUserId,
    hasMoreMessages,
    loadingMoreMessages,
    loadConversations,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    markAsRead,
    sendTypingNotification,
    handleTypingNotification,
    setActiveConversation,
    setError,
    reloadConversations // ✅ EXPONER FUNCIÓN PARA USO MANUAL
  };
};