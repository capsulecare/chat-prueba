import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { websocketService } from '../services/websocket';
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

  // ✅ SUSCRIPCIÓN WEBSOCKET CON SERVICIO MODULAR
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
          (mensaje: Mensaje) => {
            console.log('📨 MENSAJE RECIBIDO:', mensaje);
            
            const chatMessage = transformMensajeToChatMessage(mensaje);
            console.log('🔄 Mensaje transformado:', chatMessage);
            
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

            // ✅ ACTUALIZAR CONVERSACIONES CON CONTEO CORRECTO
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
  }, [conversations.length, currentUserId, activeConversationId]);

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

  // ✅ CARGAR MENSAJES INICIALES
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
      } else {
        console.log('❌ WebSocket no conectado');
        throw new Error('WebSocket no conectado');
      }
    } catch (err) {
      setError('Error al enviar mensaje');
      console.error('❌ Error sending message:', err);
    }
  }, [currentUserId]);

  // ✅ MARCAR COMO LEÍDO CON ACTUALIZACIÓN DE CONVERSACIÓN
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

      // ✅ ACTUALIZAR CONVERSACIÓN INMEDIATAMENTE
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
    setError
  };
};