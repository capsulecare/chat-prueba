export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    // Mismo día: muestra la hora (ej: "14:30")
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } else if (days === 1) {
    // Ayer: muestra "Ayer"
    return 'Ayer';
  } else if (days < 7) {
    // Entre 2-6 días: muestra "2d", "3d", etc.
    return `${days}d`;
  } else {
    // Más de 7 días: muestra fecha completa "DD/MM/YYYY"
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  }
};

export const formatChatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};