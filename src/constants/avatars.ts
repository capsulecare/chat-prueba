/**
 * Pool de avatares públicos de Pexels
 * 20 imágenes variadas para asignar a usuarios de forma consistente
 */
export const AVATAR_POOL: string[] = [
  'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1484794/pexels-photo-1484794.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1758144/pexels-photo-1758144.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1844547/pexels-photo-1844547.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/1933873/pexels-photo-1933873.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/2709388/pexels-photo-2709388.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/2741701/pexels-photo-2741701.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'https://images.pexels.com/photos/3211476/pexels-photo-3211476.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
];

/**
 * Tipos para roles del frontend
 */
export type FrontendRole = 'mentor' | 'colaborador';

/**
 * Asigna un avatar de forma consistente basado en el ID del usuario
 * @param userId - ID del usuario
 * @returns URL del avatar asignado
 */
export const getAvatarForUser = (userId: number): string => {
  const avatarIndex = userId % AVATAR_POOL.length;
  return AVATAR_POOL[avatarIndex];
};

/**
 * Mapea roles del backend a roles del frontend
 * @param backendRole - Rol del backend
 * @returns Rol mapeado para el frontend
 */
export const mapBackendRoleToFrontend = (backendRole: string): FrontendRole => {
  switch (backendRole?.toLowerCase()) {
    case 'mentor':
    case 'mentors':
      return 'mentor';
    case 'colaborador':
    case 'colaboradores':
    case 'collaborator':
    case 'user':
    default:
      return 'colaborador';
  }
};

/**
 * Obtiene el color asociado a un rol
 * @param role - Rol del usuario
 * @returns Clase CSS para el color
 */
export const getRoleColor = (role: string): string => {
  switch (role?.toLowerCase()) {
    case 'mentor':
      return 'bg-purple-500';
    case 'colaborador':
    case 'collaborator':
      return 'bg-blue-500';
    case 'admin':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Formatea el nombre del rol para mostrar
 * @param role - Rol del usuario
 * @returns Nombre formateado del rol
 */
export const formatRole = (role: string): string => {
  switch (role?.toLowerCase()) {
    case 'mentor':
      return 'Mentor';
    case 'colaborador':
    case 'collaborator':
      return 'Colaborador';
    case 'admin':
      return 'Admin';
    default:
      return 'Usuario';
  }
};