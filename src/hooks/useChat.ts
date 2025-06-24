import { useState, useEffect, useCallback } from 'react';
import { useConversations } from './chat/useConversations';
import { useMessages } from './chat/useMessages';
import { useWebSocketSubscriptions } from './chat/useWebSocketSubscriptions';
import { useChatActions } from './chat/useChatActions';
import { useTypingUsers } from './chat/useTypingUsers';

export const useChat = (currentUserId: number) => {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  console.log('🔍 DEBUG useChat - currentUserId recibido:', currentUserId);

  // ✅ HOOKS MODULARES
  const conversationsHook = useConversations(currentUserId);
  const messagesHook = useMessages();
  const actionsHook = useChatActions(currentUserId);
  const typingHook = useTypingUsers(currentUserId);

  // ✅ FUNCIÓN PARA ESTABLECER CONVERSACIÓN ACTIVA
  const setActiveConversation = useCallback((conversationId: number | null) => {
    console.log('🎯 Estableciendo conversación activa:', conversationId);
    setActiveConversationId(conversationId);
  }, []);

  // ✅ CALLBACK PARA CUANDO SE RECIBE UN MENSAJE
  const handleMessageReceived = useCallback((conversationId: number, message: any) => {
    // Verificar si la conversación existe
    const conversationExists = conversationsHook.conversations.some(conv => conv.id === conversationId);
    
    if (!conversationExists) {
      console.log('🆕 Mensaje de conversación nueva detectado - Recargando conversaciones...');
      // Recargar conversaciones cuando llega mensaje de conversación nueva
      setTimeout(() => {
        conversationsHook.reloadConversations();
      }, 500);
    }
    
    return messagesHook.addMessage(conversationId, message);
  }, [conversationsHook.conversations, conversationsHook.reloadConversations, messagesHook.addMessage]);

  // ✅ CALLBACK PARA ACTUALIZAR CONVERSACIÓN
  const handleConversationUpdate = useCallback((conversationId: number, updates: any) => {
    conversationsHook.updateConversation(conversationId, updates);
  }, [conversationsHook.updateConversation]);

  // ✅ CALLBACK PARA NUEVA CONVERSACIÓN DETECTADA
  const handleNewConversationDetected = useCallback(async () => {
    await conversationsHook.reloadConversations();
  }, [conversationsHook.reloadConversations]);

  // ✅ MARCAR COMO LEÍDO CON ACTUALIZACIÓN DE CONVERSACIÓN
  const markAsRead = useCallback(async (conversationId: number) => {
    await actionsHook.markAsRead(conversationId);
    conversationsHook.markConversationAsRead(conversationId);
  }, [actionsHook.markAsRead, conversationsHook.markConversationAsRead]);

  // ✅ ENVIAR MENSAJE CON RECARGA DE CONVERSACIONES
  const sendMessage = useCallback(async (conversationId: number, content: string) => {
    await actionsHook.sendMessage(conversationId, content);
    
    // Después de enviar, recargar conversaciones por si es una nueva
    setTimeout(async () => {
      await conversationsHook.reloadConversations();
    }, 500);
  }, [actionsHook.sendMessage, conversationsHook.reloadConversations]);

  // ✅ SUSCRIPCIONES WEBSOCKET
  useWebSocketSubscriptions({
    conversations: conversationsHook.conversations,
    currentUserId,
    activeConversationId,
    onMessageReceived: handleMessageReceived,
    onConversationUpdate: handleConversationUpdate,
    onNewConversationDetected: handleNewConversationDetected,
    markAsRead
  });

  // ✅ CARGAR CONVERSACIONES AL MONTAR - CORREGIDO: useEffect en lugar de useState
  useEffect(() => {
    conversationsHook.loadConversations();
  }, [conversationsHook.loadConversations]);

  // ✅ RETORNAR API UNIFICADA
  return {
    // Estados
    conversations: conversationsHook.conversations,
    messages: messagesHook.messages,
    loading: conversationsHook.loading,
    error: conversationsHook.error,
    typingUsers: typingHook.typingUsers,
    activeConversationId,
    currentUserId,
    hasMoreMessages: messagesHook.hasMoreMessages,
    loadingMoreMessages: messagesHook.loadingMoreMessages,

    // Acciones
    loadConversations: conversationsHook.loadConversations,
    loadMessages: messagesHook.loadMessages,
    loadMoreMessages: messagesHook.loadMoreMessages,
    sendMessage,
    markAsRead,
    sendTypingNotification: actionsHook.sendTypingNotification,
    handleTypingNotification: typingHook.handleTypingNotification,
    setActiveConversation,
    setError: conversationsHook.setError,
    reloadConversations: conversationsHook.reloadConversations
  };
};