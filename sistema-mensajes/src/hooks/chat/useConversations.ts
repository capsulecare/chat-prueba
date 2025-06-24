import { useState, useCallback } from 'react';
import { apiService } from '../../services/apiService';
import type { ChatConversation } from '../../types/api';
import { transformConversacionResumenToChatConversation } from '../../utils/dataTransformers';

export const useConversations = (currentUserId: number) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Recargar conversaciones (para nuevas conversaciones)
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

  // Actualizar conversación específica
  const updateConversation = useCallback((conversationId: number, updates: Partial<ChatConversation>) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, ...updates }
          : conv
      ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    );
  }, []);

  // Marcar conversación como leída
  const markConversationAsRead = useCallback((conversationId: number) => {
    updateConversation(conversationId, { unreadCount: 0 });
  }, [updateConversation]);

  return {
    conversations,
    loading,
    error,
    loadConversations,
    reloadConversations,
    updateConversation,
    markConversationAsRead,
    setConversations,
    setError
  };
};