package com.example.demo.chat.controller;

import com.example.demo.chat.dto.MarcarLeidosRequest;
import com.example.demo.chat.dto.MensajeWebSocketDTO;
import com.example.demo.chat.dto.UsuarioEscribiendoDTO;
import com.example.demo.chat.model.Mensaje;
import com.example.demo.chat.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // 📩 Enviar mensaje por WebSocket
    @MessageMapping("/chat.enviarMensaje")
    public void enviarMensajeWebSocket(@Payload MensajeWebSocketDTO dto) {
        System.out.println("MENSAJE RECIBIDO POR WEBSOCKET: " + dto.getContenido());
        System.out.println("Conversación: " + dto.getIdConversacion() + ", Emisor: " + dto.getIdEmisor());

        Mensaje nuevoMensaje = chatService.enviarMensaje(
                dto.getIdConversacion(),
                dto.getIdEmisor(),
                dto.getContenido()
        );

        System.out.println("Mensaje guardado con ID: " + nuevoMensaje.getId());

        // VERIFICACIÓN CRÍTICA: Asegurar que el emisor esté completo
        if (nuevoMensaje.getEmisor() == null) {
            System.err.println("ERROR CRÍTICO: Mensaje sin emisor!");
            return;
        }

        System.out.println("Emisor verificado: " + nuevoMensaje.getEmisor().getName() + " (ID: " + nuevoMensaje.getEmisor().getId() + ")");
        System.out.println("Enviando a topic: /topic/conversacion/" + dto.getIdConversacion());

        // CRÍTICO: Crear objeto completo para enviar por WebSocket
        MensajeCompleto mensajeCompleto = new MensajeCompleto();
        mensajeCompleto.setId(nuevoMensaje.getId());
        mensajeCompleto.setContenido(nuevoMensaje.getContenido());
        mensajeCompleto.setLeido(nuevoMensaje.isLeido());
        mensajeCompleto.setTimestampEnvio(nuevoMensaje.getTimestampEnvio().toString());

        // INCLUIR EMISOR COMPLETO
        EmisorCompleto emisor = new EmisorCompleto();
        emisor.setId(nuevoMensaje.getEmisor().getId());
        emisor.setNombre(nuevoMensaje.getEmisor().getName());
        emisor.setEmail(nuevoMensaje.getEmisor().getEmail());
        mensajeCompleto.setEmisor(emisor);

        System.out.println("Enviando mensaje completo con emisor: " + emisor.getName());

        // ENVIAR MENSAJE COMPLETO A TODOS LOS SUSCRIPTORES
        messagingTemplate.convertAndSend(
                "/topic/conversacion/" + dto.getIdConversacion(),
                mensajeCompleto
        );

        System.out.println("Mensaje enviado por WebSocket exitosamente!");
    }

    // Notificar que un usuario está escribiendo
    @MessageMapping("/chat.typing")
    public void notificarUsuarioEscribiendo(@Payload UsuarioEscribiendoDTO dto) {
        System.out.println("⌨Usuario " + dto.getIdUsuario() + " está escribiendo en conversación " + dto.getIdConversacion());

        messagingTemplate.convertAndSend(
                "/topic/conversacion/" + dto.getIdConversacion() + "/typing",
                dto.getIdUsuario()
        );
    }

    // Notificar que los mensajes han sido leídos
    @MessageMapping("/chat.leerMensajes")
    public void marcarMensajesLeidos(@Payload MarcarLeidosRequest request) {
        System.out.println("👁Marcando mensajes como leídos - Conversación: " + request.getIdConversacion() + ", Usuario: " + request.getIdUsuario());

        chatService.marcarMensajesComoLeidos(request.getIdConversacion(), request.getIdUsuario());

        // Notificar al otro usuario que los mensajes han sido leídos
        messagingTemplate.convertAndSend(
                "/topic/conversacion/" + request.getIdConversacion() + "/leido",
                request.getIdUsuario()
        );
    }

    // CLASES INTERNAS PARA MENSAJE COMPLETO
    public static class MensajeCompleto {
        private Long id;
        private String contenido;
        private boolean leido;
        private String timestampEnvio;
        private EmisorCompleto emisor;

        // Getters y setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getContenido() { return contenido; }
        public void setContenido(String contenido) { this.contenido = contenido; }

        public boolean isLeido() { return leido; }
        public void setLeido(boolean leido) { this.leido = leido; }

        public String getTimestampEnvio() { return timestampEnvio; }
        public void setTimestampEnvio(String timestampEnvio) { this.timestampEnvio = timestampEnvio; }

        public EmisorCompleto getEmisor() { return emisor; }
        public void setEmisor(EmisorCompleto emisor) { this.emisor = emisor; }
    }

    public static class EmisorCompleto {
        private Long id;
        private String nombre;
        private String email;

        // Getters y setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getName() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }
}