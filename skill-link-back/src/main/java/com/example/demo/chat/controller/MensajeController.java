package com.example.demo.chat.controller;

import com.example.demo.chat.dto.EnviarMensajeRequest;
import com.example.demo.chat.dto.MarcarLeidosRequest;
import com.example.demo.chat.dto.MensajeDTO;
import com.example.demo.chat.model.Mensaje;
import com.example.demo.chat.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mensajes")
public class MensajeController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<Mensaje> enviarMensaje(@RequestBody EnviarMensajeRequest request) {
        System.out.println("📨 REST: Enviando mensaje...");
        System.out.println("📋 Conversación: " + request.getIdConversacion() + ", Emisor: " + request.getIdEmisor());
        System.out.println("💬 Contenido: " + request.getContenido());

        Mensaje mensaje = chatService.enviarMensaje(
                request.getIdConversacion(),
                request.getIdEmisor(),
                request.getContenido()
        );

        System.out.println("Mensaje guardado con ID: " + mensaje.getId());

        try {
            System.out.println("REST: Enviando notificación WebSocket a topic: /topic/conversacion/" + request.getIdConversacion());

            MensajeCompleto mensajeCompleto = new MensajeCompleto();
            mensajeCompleto.setId(mensaje.getId());
            mensajeCompleto.setContenido(mensaje.getContenido());
            mensajeCompleto.setLeido(mensaje.isLeido());
            mensajeCompleto.setTimestampEnvio(mensaje.getTimestampEnvio().toString());

            EmisorCompleto emisor = new EmisorCompleto();
            emisor.setId(mensaje.getEmisor().getId());
            emisor.setNombre(mensaje.getEmisor().getName());
            emisor.setEmail(mensaje.getEmisor().getEmail());
            mensajeCompleto.setEmisor(emisor);

            System.out.println("REST: Enviando mensaje completo con emisor: " + emisor.getName());

            messagingTemplate.convertAndSend(
                    "/topic/conversacion/" + request.getIdConversacion(),
                    mensajeCompleto
            );
            System.out.println("REST: Notificación WebSocket enviada exitosamente!");
        } catch (Exception e) {
            System.err.println("REST: Error enviando notificación WebSocket: " + e.getMessage());
            e.printStackTrace();
        }

        return ResponseEntity.ok(mensaje);
    }

    //  Obtener últimos mensajes (compatibilidad)
    @GetMapping("/conversacion/{idConversacion}")
    public ResponseEntity<List<MensajeDTO>> obtenerUltimosMensajes(@PathVariable Long idConversacion) {
        System.out.println("REST: Obteniendo últimos mensajes para conversación: " + idConversacion);

        List<MensajeDTO> mensajesDTO = chatService.obtenerMensajesDTO(idConversacion);

        System.out.println("REST: Devolviendo " + mensajesDTO.size() + " mensajes");
        return ResponseEntity.ok(mensajesDTO);
    }

    // Obtener mensajes con paginación
    @GetMapping("/conversacion/{idConversacion}/paginado")
    public ResponseEntity<List<MensajeDTO>> obtenerMensajesPaginados(
            @PathVariable Long idConversacion,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        System.out.println("REST: Obteniendo mensajes paginados - Conversación: " + idConversacion +
                ", Página: " + page + ", Tamaño: " + size);

        List<MensajeDTO> mensajesDTO = chatService.obtenerMensajesPaginados(idConversacion, page, size);

        System.out.println("REST: Devolviendo " + mensajesDTO.size() + " mensajes de la página " + page);
        return ResponseEntity.ok(mensajesDTO);
    }

    @PutMapping("/leer")
    public ResponseEntity<Void> marcarMensajesComoLeidos(@RequestBody MarcarLeidosRequest request) {
        chatService.marcarMensajesComoLeidos(request.getIdConversacion(), request.getIdUsuario());
        return ResponseEntity.ok().build();
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