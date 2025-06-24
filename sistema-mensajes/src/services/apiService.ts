import type { 
  ConversacionResumenDTO, 
  CrearConversacionRequest, 
  EnviarMensajeRequest, 
  MarcarLeidosRequest,
  MensajeDTO,
  Conversacion,
  Mensaje
} from '../types/api';
import { API_CONFIG } from '../config/api';

class ApiService {
  private baseUrl = API_CONFIG.BASE_URL;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      const hasContent = response.status !== 204 && response.headers.get('content-length') !== '0';
      
      if (hasContent && contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return undefined as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Conversaciones
  async crearConversacion(request: CrearConversacionRequest): Promise<Conversacion> {
    return this.request<Conversacion>(API_CONFIG.ENDPOINTS.CONVERSACIONES, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async listarConversaciones(idUsuario: number): Promise<Conversacion[]> {
    return this.request<Conversacion[]>(
      API_CONFIG.ENDPOINTS.CONVERSACIONES_USUARIO(idUsuario)
    );
  }

  async listarResumenesConversaciones(idUsuario: number): Promise<ConversacionResumenDTO[]> {
    return this.request<ConversacionResumenDTO[]>(
      API_CONFIG.ENDPOINTS.CONVERSACIONES_RESUMEN(idUsuario)
    );
  }

  // Mensajes
  async enviarMensaje(request: EnviarMensajeRequest): Promise<Mensaje> {
    return this.request<Mensaje>(API_CONFIG.ENDPOINTS.MENSAJES, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async obtenerMensajes(idConversacion: number): Promise<MensajeDTO[]> {
    return this.request<MensajeDTO[]>(
      API_CONFIG.ENDPOINTS.MENSAJES_CONVERSACION(idConversacion)
    );
  }

  // ✅ IMPLEMENTACIÓN REAL: Obtener mensajes con paginación
  async obtenerMensajesPaginados(
    idConversacion: number, 
    page: number = 0, 
    size: number = 20
  ): Promise<MensajeDTO[]> {
    console.log('📥 API: Solicitando mensajes paginados:', { idConversacion, page, size });
    
    const endpoint = `${API_CONFIG.ENDPOINTS.MENSAJES_PAGINADO(idConversacion)}?page=${page}&size=${size}`;
    
    try {
      const mensajes = await this.request<MensajeDTO[]>(endpoint);
      console.log('✅ API: Mensajes paginados recibidos:', mensajes.length);
      return mensajes;
    } catch (error) {
      console.error('❌ API: Error obteniendo mensajes paginados:', error);
      throw error;
    }
  }

  async marcarMensajesComoLeidos(request: MarcarLeidosRequest): Promise<void> {
    const url = `${this.baseUrl}${API_CONFIG.ENDPOINTS.MENSAJES_LEER}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return;
  }
}

export const apiService = new ApiService();