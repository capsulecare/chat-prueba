import { useState, useCallback } from 'react';

export const useTypingUsers = (currentUserId: number) => {
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: number]: number[] }>({});

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

  return {
    typingUsers,
    handleTypingNotification
  };
};