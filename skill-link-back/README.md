# 🚀 SkillLink Backend - API REST + WebSockets

## 📋 Descripción
Backend para sistema de mensajería en tiempo real. Implementa API REST para gestión de datos y WebSockets para comunicación en tiempo real entre usuarios.

---

## 🏗️ Arquitectura del Backend

### 📁 Estructura de Carpetas

```
src/main/java/com/example/demo/
├── chat/                    # Módulo de chat
│   ├── controller/         # Controladores REST y WebSocket
│   ├── dto/               # Data Transfer Objects
│   ├── model/             # Entidades JPA
│   ├── repository/        # Repositorios de datos
│   └── service/           # Lógica de negocio
├── user/                   # Módulo de usuarios
│   ├── controller/        # Autenticación y gestión de usuarios
│   ├── dto/              # DTOs de usuario
│   ├── model/            # Entidades de usuario
│   ├── repository/       # Repositorios de usuario
│   └── service/          # Servicios de usuario
├── infra/                 # Infraestructura
│   ├── config/           # Configuraciones (CORS, WebSocket, Security)
│   ├── security/         # JWT y autenticación
│   └── springdoc/        # Documentación Swagger
└── common/               # Enums y utilidades compartidas
```

### 🔧 Flujo de Trabajo

#### 1. **Autenticación**
```
POST /usuarios/login → JWT Token → Headers Authorization
```

#### 2. **Gestión de Conversaciones**
```
GET /api/conversaciones/resumen/{userId} → Lista conversaciones
POST /api/conversaciones → Crear nueva conversación
```

#### 3. **Gestión de Mensajes**
```
GET /api/mensajes/conversacion/{id} → Últimos 20 mensajes
GET /api/mensajes/conversacion/{id}/paginado → Mensajes paginados
POST /api/mensajes → Enviar mensaje (REST fallback)
PUT /api/mensajes/leer → Marcar mensajes como leídos
```

#### 4. **WebSocket en Tiempo Real**
```
Conexión: ws://localhost:8080/ws
Protocolo: STOMP sobre WebSocket

Destinos de envío:
├── /app/chat.enviarMensaje     # Enviar mensaje
├── /app/chat.typing            # Notificar escritura
└── /app/chat.leerMensajes      # Marcar como leído

Topics de suscripción:
├── /topic/conversacion/{id}           # Mensajes nuevos
├── /topic/conversacion/{id}/typing    # Usuarios escribiendo
└── /topic/conversacion/{id}/leido     # Mensajes leídos
```

---

## 📡 Endpoints de la API

### 🔐 **Autenticación**

#### **POST** `/usuarios/register`
```json
{
  "name": "Juan",
  "secondName": "Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "role": "Colaborador",
  "interests": ["TECNOLOGIA", "NEGOCIOS_EMPRENDIMIENTO"]
}
```

#### **POST** `/usuarios/login`
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

### 💬 **Conversaciones**

#### **GET** `/api/conversaciones/resumen/{userId}`
Obtiene resumen de conversaciones del usuario
```json
[
  {
    "idConversacion": 1,
    "idOtroUsuario": 2,
    "nombreOtroUsuario": "Ana Torres",
    "emailOtroUsuario": "ana@example.com",
    "ultimoMensaje": "Hola, ¿cómo estás?",
    "timestampUltimoMensaje": "2024-01-15T10:30:00",
    "mensajesNoLeidos": 3
  }
]
```

#### **POST** `/api/conversaciones`
Crear nueva conversación
```json
{
  "idUsuario1": 1,
  "idUsuario2": 2
}
```

### 📨 **Mensajes**

#### **GET** `/api/mensajes/conversacion/{id}`
Obtiene últimos 20 mensajes de una conversación

#### **GET** `/api/mensajes/conversacion/{id}/paginado?page=0&size=20`
Obtiene mensajes con paginación

#### **POST** `/api/mensajes`
Enviar mensaje (fallback REST)
```json
{
  "idConversacion": 1,
  "idEmisor": 1,
  "contenido": "Hola, ¿cómo estás?"
}
```

#### **PUT** `/api/mensajes/leer`
Marcar mensajes como leídos
```json
{
  "idConversacion": 1,
  "idUsuario": 1
}
```

---

## 🔌 WebSocket - Mensajería en Tiempo Real

### **Conexión**
```javascript
const client = new Client({
  webSocketFactory: () => new WebSocket('ws://localhost:8080/ws'),
  onConnect: () => console.log('Conectado'),
  onStompError: (error) => console.error('Error STOMP:', error)
});
client.activate();
```

### **Enviar Mensaje**
```javascript
client.publish({
  destination: '/app/chat.enviarMensaje',
  body: JSON.stringify({
    idConversacion: 1,
    idEmisor: 1,
    contenido: "Hola desde WebSocket"
  })
});
```

### **Suscribirse a Mensajes**
```javascript
client.subscribe('/topic/conversacion/1', (message) => {
  const mensaje = JSON.parse(message.body);
  console.log('Nuevo mensaje:', mensaje);
});
```

### **Notificar Escritura**
```javascript
client.publish({
  destination: '/app/chat.typing',
  body: JSON.stringify({
    idConversacion: 1,
    idUsuario: 1
  })
});
```

### **Marcar como Leído**
```javascript
client.publish({
  destination: '/app/chat.leerMensajes',
  body: JSON.stringify({
    idConversacion: 1,
    idUsuario: 1
  })
});
```

---

## 🗄️ Modelo de Datos

### **Usuario**
```sql
CREATE TABLE usuarios (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  role ENUM('Mentor', 'Colaborador', 'Admin'),
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Conversación**
```sql
CREATE TABLE conversaciones (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  usuario1_id BIGINT NOT NULL,
  usuario2_id BIGINT NOT NULL,
  FOREIGN KEY (usuario1_id) REFERENCES usuarios(id),
  FOREIGN KEY (usuario2_id) REFERENCES usuarios(id)
);
```

### **Mensaje**
```sql
CREATE TABLE mensajes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  timestamp_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  emisor_id BIGINT NOT NULL,
  conversacion_id BIGINT NOT NULL,
  FOREIGN KEY (emisor_id) REFERENCES usuarios(id),
  FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id)
);
```

---

## 🚀 Comandos de Desarrollo

```bash
# Ejecutar aplicación
./mvnw spring-boot:run

# Compilar
./mvnw clean compile

# Ejecutar tests
./mvnw test

# Generar JAR
./mvnw clean package
```

---

## 🔧 Configuración

### **application.properties**
```properties
# Base de datos
spring.datasource.url=jdbc:mysql://localhost:3306/skilllink
spring.datasource.username=root
spring.datasource.password=${DB_PASSWORD}

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# JWT
jwt.secret=${JWT_SECRET}

# CORS
app.frontend.url=http://localhost:5173
```

### **Variables de Entorno**
```bash
DB_PASSWORD=tu_password_mysql
JWT_SECRET=tu_jwt_secret_key
```

---

## 🛠️ Tecnologías Utilizadas

- **Spring Boot 3.5** - Framework principal
- **Spring Security** - Autenticación y autorización
- **Spring Data JPA** - Persistencia de datos
- **Spring WebSocket** - Comunicación en tiempo real
- **MySQL** - Base de datos
- **JWT** - Tokens de autenticación
- **STOMP** - Protocolo de mensajería
- **Swagger/OpenAPI** - Documentación de API

---

## 📊 Endpoints de Testing Rápido

### **Prueba de Conexión**
```bash
curl -X GET http://localhost:8080/api/conversaciones/resumen/1
```

### **Login de Prueba**
```bash
curl -X POST http://localhost:8080/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### **Enviar Mensaje**
```bash
curl -X POST http://localhost:8080/api/mensajes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"idConversacion":1,"idEmisor":1,"contenido":"Mensaje de prueba"}'
```

### **WebSocket Test (JavaScript)**
```javascript
// Conectar y enviar mensaje de prueba
const client = new Client({
  webSocketFactory: () => new WebSocket('ws://localhost:8080/ws')
});

client.onConnect = () => {
  // Suscribirse
  client.subscribe('/topic/conversacion/1', (msg) => {
    console.log('Mensaje recibido:', JSON.parse(msg.body));
  });
  
  // Enviar mensaje
  client.publish({
    destination: '/app/chat.enviarMensaje',
    body: JSON.stringify({
      idConversacion: 1,
      idEmisor: 1,
      contenido: "Test desde WebSocket"
    })
  });
};

client.activate();
```

---

## 🔒 Seguridad

- **JWT Authentication** - Tokens seguros para autenticación
- **CORS Configuration** - Configuración específica para frontend
- **Password Encryption** - BCrypt para encriptación de contraseñas
- **SQL Injection Prevention** - JPA con prepared statements
- **XSS Protection** - Validación y sanitización de entrada

---

## 📈 Monitoreo y Logs

- **Logs detallados** en consola para debugging
- **Swagger UI** disponible en `/swagger-ui.html`
- **Health checks** automáticos de Spring Boot
- **Métricas** de conexiones WebSocket en logs