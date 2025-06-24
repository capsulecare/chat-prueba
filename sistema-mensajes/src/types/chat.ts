export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'mentor' | 'colaborador';
  status: 'online' | 'offline' | 'away';
  expertise?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
  title?: string;
  type: 'direct' | 'group' | 'mentorship';
}