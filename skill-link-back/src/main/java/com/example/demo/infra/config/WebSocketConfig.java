package com.example.demo.infra.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // ✅ Habilitar broker simple para topics y queues
        config.enableSimpleBroker("/topic", "/queue")
              .setHeartbeatValue(new long[]{10000, 10000}); // ✅ CORRECCIÓN: Aplicar heartbeat al broker
        
        // ✅ Prefijo para destinos de aplicación
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // ✅ ENDPOINT PRINCIPAL - WebSocket nativo
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                    "http://localhost:*",
                    "https://localhost:*",
                    "http://127.0.0.1:*",
                    "https://127.0.0.1:*"
                );

        // ✅ ENDPOINT FALLBACK - Con SockJS para compatibilidad
        registry.addEndpoint("/ws-sockjs")
                .setAllowedOriginPatterns(
                    "http://localhost:*",
                    "https://localhost:*",
                    "http://127.0.0.1:*",
                    "https://127.0.0.1:*"
                )
                .withSockJS()
                .setHeartbeatTime(25000); // ✅ Heartbeat específico para SockJS
    }
}