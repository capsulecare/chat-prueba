package com.example.demo.chat.controller;

import com.example.demo.chat.dto.MarcarLeidosRequest;
import com.example.demo.chat.dto.MensajeCompletoDTO;
import com.example.demo.chat.dto.MensajeWebSocketDTO;
import com.example.demo.chat.dto.UsuarioEscribiendoDTO;
import com.example.demo.chat.model.Mensaje;
import com.example.demo.chat.service.ChatService;
import com.example.demo.chat.service.MensajeTransformService;
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

    @Autowired
    private MensajeTransformService mensajeTransformService;

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

        try {
            // ✅ USAR SERVICIO DE TRANSFORMACIÓN
            MensajeCompletoDTO mensajeCompleto = mensajeTransformService.transformToCompleteDTO(nuevoMensaje);
            
            System.out.println("Enviando mensaje completo con emisor: " + mensajeCompleto.getEmisor().getNombre());

            // ENVIAR MENSAJE COMPLETO A TODOS LOS SUSCRIPTORES
            messagingTemplate.convertAndSend(
                    "/topic/conversacion/" + dto.getIdConversacion(),
                    mensajeCompleto
            );

            System.out.println("Mensaje enviado por WebSocket exitosamente!");
            
        } catch (Exception e) {
            System.err.println("❌ Error transformando o enviando mensaje: " + e.getMessage());
            e.printStackTrace();
        }
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
}