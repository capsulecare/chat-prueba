import { useState } from 'react';
import { Header } from './components/layout/Header';
import { ChatInterface } from './components/chat/ChatInterface';
import { UserSelector } from './components/debug/UserSelector';
import { useChat } from './hooks/chat/useChat';

function App() {
  const [activeSection, setActiveSection] = useState('messages');
  
  // ✅ OBTENER USER ID DESDE URL O USAR DEFAULT
  const getUserIdFromUrl = (): number => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');
    return userIdParam ? parseInt(userIdParam, 10) : 1;
  };

  const [currentUserId, setCurrentUserId] = useState<number>(getUserIdFromUrl());
  
  // ✅ UNA SOLA INSTANCIA DE useChat PARA TODA LA APP
  const chatData = useChat(currentUserId);
  
  // ✅ CALCULAR TOTAL DE NO LEÍDOS EN TIEMPO REAL
  const totalUnreadCount = chatData.conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  // ✅ FUNCIÓN CORREGIDA PARA SELECCIONAR CONVERSACIÓN DESDE NOTIFICACIONES
  const handleSelectConversationFromNotification = (conversationId: number) => {
    console.log('🎯 App.tsx - Seleccionando conversación desde notificación:', conversationId);
    
    // ✅ PASO 1: Cambiar a sección de mensajes
    setActiveSection('messages');
    
    // ✅ PASO 2: Establecer conversación activa en el hook de chat
    if (chatData.setActiveConversation && conversationId > 0) {
      // Usar setTimeout para asegurar que el cambio de sección se procese primero
      setTimeout(() => {
        chatData.setActiveConversation(conversationId);
        console.log('✅ App.tsx - Conversación establecida:', conversationId);
      }, 150); // Aumentar el delay para mejor coordinación
    }
  };

  // ✅ FUNCIÓN PARA CAMBIAR USUARIO
  const handleUserChange = (newUserId: number) => {
    setCurrentUserId(newUserId);
    // Actualizar URL sin recargar
    const url = new URL(window.location.href);
    url.searchParams.set('userId', newUserId.toString());
    window.history.replaceState({}, '', url.toString());
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'messages':
        return <ChatInterface chatData={chatData} />;
      case 'dashboard':
        return (
          <div className="h-full flex items-center justify-center bg-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
              <p className="text-gray-600">Próximamente...</p>
            </div>
          </div>
        );
      case 'events':
        return (
          <div className="h-full flex items-center justify-center bg-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Eventos</h2>
              <p className="text-gray-600">Próximamente...</p>
            </div>
          </div>
        );
      case 'mentors':
        return (
          <div className="h-full flex items-center justify-center bg-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Mentores</h2>
              <p className="text-gray-600">Próximamente...</p>
            </div>
          </div>
        );
      default:
        return <ChatInterface chatData={chatData} />;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        totalUnreadCount={totalUnreadCount}
        conversations={chatData.conversations}
        activeConversationId={chatData.activeConversationId}
        onSelectConversation={handleSelectConversationFromNotification}
      />
      
      {/* ✅ SELECTOR DE USUARIO FLOTANTE */}
      <UserSelector 
        currentUserId={currentUserId}
        onUserChange={handleUserChange}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;