# 🚀 SkillLink - Sistema de Mensajería en Tiempo Real

## 📋 Descripción
Sistema de chat en tiempo real para una plataforma emprendedora que conecta mentores y colaboradores. Implementa WebSockets para comunicación instantánea, notificaciones push y gestión avanzada de conversaciones.

---

## 🏗️ Arquitectura del Frontend

### 📁 Estructura de Carpetas

```
src/
├── components/           # Componentes React reutilizables
│   ├── chat/            # Componentes específicos del chat
│   │   ├── conversation/    # Lista y gestión de conversaciones
│   │   ├── window/         # Ventana de chat y mensajes
│   │   └── shared/         # Componentes compartidos (input, burbujas)
│   ├── layout/          # Componentes de layout (Header, etc.)
│   ├── notifications/   # Sistema de notificaciones
│   └── debug/          # Herramientas de desarrollo y testing
├── hooks/               # Custom hooks modulares
│   ├── chat/           # Hooks específicos del chat
│   ├── websocket/      # Hooks de conexión WebSocket
│   └── notifications/  # Hooks de notificaciones
├── services/           # Servicios y lógica de negocio
│   ├── websocket/      # Servicio WebSocket modular
│   └── apiService.ts   # Cliente API REST
├── types/              # Definiciones de tipos TypeScript
├── utils/              # Utilidades y transformadores
├── constants/          # Constantes y configuración
└── config/             # Configuración de la aplicación
```

### 🔧 Flujo de Trabajo

#### 1. **Inicialización de la App**
- `App.tsx` → Punto de entrada principal
- Obtiene `userId` desde URL o usa default
- Inicializa `useChat` (hook principal)
- Gestiona navegación entre secciones

#### 2. **Sistema de Chat Modular**
```
useChat (Orquestador principal)
├── useConversations    # Gestión de lista de conversaciones
├── useMessages         # Gestión de mensajes y paginación
├── useChatActions      # Acciones (enviar, marcar leído)
├── useTypingUsers      # Usuarios escribiendo
└── useWebSocketSubscriptions # Suscripciones en tiempo real
```

#### 3. **Conexión WebSocket**
```
WebSocketService (Modular)
├── WebSocketConnection    # Gestión de conexión
├── SubscriptionManager    # Gestión de suscripciones
└── MessagePublisher       # Envío de mensajes
```

#### 4. **Flujo de Mensajes**
1. **Envío**: `ChatInput` → `useChatActions` → `WebSocketService` → Backend
2. **Recepción**: Backend → `WebSocketService` → `useWebSocketSubscriptions` → `useMessages`
3. **Actualización**: Estado actualizado → Re-render automático

#### 5. **Sistema de Notificaciones**
- `useNotifications` → Calcula notificaciones basadas en conversaciones
- `NotificationDropdown` → Muestra notificaciones en tiempo real
- Auto-navegación a conversaciones desde notificaciones

---

## 🎯 Características Principales

### ✅ **Chat en Tiempo Real**
- WebSockets con STOMP para comunicación bidireccional
- Reconexión automática en caso de pérdida de conexión
- Indicadores de "escribiendo" en tiempo real

### ✅ **Gestión Avanzada de Conversaciones**
- Lista de conversaciones con últimos mensajes
- Contadores de mensajes no leídos
- Búsqueda y filtrado de conversaciones

### ✅ **Sistema de Notificaciones**
- Notificaciones push para nuevos mensajes
- Navegación directa desde notificaciones
- Auto-marcado como leído cuando el chat está activo

### ✅ **Paginación de Mensajes**
- Carga inicial de últimos 20 mensajes
- Scroll infinito para cargar mensajes anteriores
- Optimización de rendimiento con lazy loading

### ✅ **Herramientas de Debug**
- Selector de usuario para testing
- Múltiples ventanas para simular conversaciones
- Logs detallados para debugging

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Linting
npm run lint
```

---

## 🔗 Integración con Backend

### **Endpoints REST**
- `GET /api/conversaciones/resumen/{userId}` - Lista de conversaciones
- `GET /api/mensajes/conversacion/{id}` - Mensajes de conversación
- `GET /api/mensajes/conversacion/{id}/paginado` - Mensajes paginados
- `POST /api/mensajes` - Enviar mensaje (fallback)
- `PUT /api/mensajes/leer` - Marcar como leído

### **WebSocket Topics**
- `/topic/conversacion/{id}` - Mensajes de conversación
- `/topic/conversacion/{id}/typing` - Indicadores de escritura
- `/topic/conversacion/{id}/leido` - Confirmaciones de lectura

---

## 🎨 Tecnologías Utilizadas

- **React 19** + **TypeScript** - Framework principal
- **Tailwind CSS** - Estilos y diseño
- **STOMP.js** - Cliente WebSocket
- **Vite** - Build tool y dev server
- **Lucide React** - Iconografía
- **Emoji Picker React** - Selector de emojis

---

## 📱 Responsive Design

- **Mobile First** - Diseño optimizado para móviles
- **Breakpoints** - Adaptación automática a diferentes pantallas
- **Touch Friendly** - Interfaz táctil optimizada
- **Progressive Enhancement** - Funcionalidad básica garantizada

---

## 🔒 Consideraciones de Seguridad

- Validación de tipos en tiempo de ejecución
- Sanitización de contenido de mensajes
- Gestión segura de tokens de autenticación
- Prevención de XSS en contenido dinámico