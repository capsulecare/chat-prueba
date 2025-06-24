import React, { useState, useEffect } from 'react';
import { ConversationList } from './conversation/ConversationList';
import { ChatWindow } from './window/ChatWindow';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { ChatUser } from '../../types/api';

interface ChatInterfaceProps {
  chatData: any;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatData }) => {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<{ [conversationId: number]: boolean }>({});

  const { connected: wsConnected, connecting: wsConnecting } = useWebSocket();
  
  const {
    conversations,
    messages,
    loading,
    error,
    typingUsers,
    currentUserId,
    hasMoreMessages,
    loadingMoreMessages,
    loadConversations,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    markAsRead,
    sendTypingNotification,
    setActiveConversation,
    setError,
    activeConversationId: hookActiveConversationId // ✅ OBTENER ID ACTIVO DEL HOOK
  } = chatData;

  // ✅ SINCRONIZAR CON EL HOOK CUANDO CAMBIE DESDE NOTIFICACIONES
  useEffect(() => {
    if (hookActiveConversationId && hookActiveConversationId !== activeConversationId) {
      console.log('🔄 ChatInterface - Sincronizando conversación desde hook:', hookActiveConversationId);
      handleSelectConversation(hookActiveConversationId);
    }
  }, [hookActiveConversationId]);

  const handleSendMessage = async (content: string) => {
    if (!activeConversationId) {
      console.error('❌ No hay conversación activa');
      return;
    }

    if (!wsConnected) {
      setError('❌ No hay conexión WebSocket. Los mensajes requieren conexión en tiempo real.');
      return;
    }
    
    await sendMessage(activeConversationId, content);
  };

  const handleSelectConversation = async (conversationId: number) => {
    if (!conversationId || typeof conversationId !== 'number' || conversationId <= 0) {
      console.error('❌ ID de conversación inválido:', conversationId);
      return;
    }

    console.log('🎯 ChatInterface - Seleccionando conversación:', conversationId);

    setActiveConversationId(conversationId);
    setActiveConversation(conversationId);
    setShowChat(true);
    
    if (!messages[conversationId]) {
      setLoadingMessages(prev => ({ ...prev, [conversationId]: true }));
      
      try {
        await loadMessages(conversationId);
      } finally {
        setLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
      }
    }
    
    await markAsRead(conversationId);
  };

  const handleBackToList = () => {
    setShowChat(false);
    setActiveConversationId(null);
    setActiveConversation(null);
  };

  const handleLoadMoreMessages = async (conversationId: number, page: number) => {
    return await loadMoreMessages(conversationId, page);
  };

  useEffect(() => {
    return () => {
      setActiveConversation(null);
    };
  }, [setActiveConversation]);

  const activeConversation = conversations.find((c: { id: number | null; }) => c.id === activeConversationId);

  const currentUser: ChatUser = {
    id: currentUserId,
    name: 'Tú',
    email: 'tu@email.com',
    avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    role: 'colaborador',
    status: 'online',
    expertise: ['Desarrollo Web', 'MVP', 'Lean Startup']
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando conversaciones</h3>
          <p className="text-gray-600">Conectando con tu red de colaboradores...</p>
          {wsConnecting && (
            <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Estableciendo conexión en tiempo real</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-white text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Error de conexión</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadConversations();
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Reintentar conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-50 to-blue-50 relative">

      {/* Lista de conversaciones */}
      <div className={`${showChat ? 'hidden lg:block' : 'block'} w-full lg:w-96 flex-shrink-0`}>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          currentUser={currentUser}
          loading={loading}
        />
      </div>

      {/* Ventana de chat */}
      <div className={`${showChat ? 'block' : 'hidden lg:block'} flex-1 min-w-0`}>
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messages={messages[activeConversationId!] || []}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
            onBack={handleBackToList}
            typingUsers={typingUsers[activeConversationId!] || []}
            onTyping={() => activeConversationId && sendTypingNotification(activeConversationId)}
            disabled={!wsConnected}
            onLoadMoreMessages={handleLoadMoreMessages}
            hasMoreMessages={hasMoreMessages[activeConversationId!] ?? true}
            loadingMoreMessages={loadingMoreMessages[activeConversationId!] ?? false}
            loadingMessages={loadingMessages[activeConversationId!] ?? false}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <div className="text-center max-w-sm mx-auto p-8">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <span className="text-white text-5xl">💬</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Selecciona una conversación
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {conversations.length === 0 
                  ? 'No hay conversaciones disponibles. Conecta con mentores y colaboradores para comenzar.'
                  : 'Elige una conversación para comenzar a intercambiar ideas y conocimientos.'
                }
              </p>
              {wsConnected && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Listo para chatear en tiempo real
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};