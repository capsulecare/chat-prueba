package com.example.demo.infra.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // ✅ Broker simple SIN heartbeat para evitar errores en producción
        config.enableSimpleBroker("/topic", "/queue");
        
        // ✅ Prefijo para destinos de aplicación
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // ✅ ENDPOINT PRINCIPAL - WebSocket nativo
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                    // ✅ DESARROLLO LOCAL
                    "http://localhost:*",
                    "https://localhost:*",
                    "http://127.0.0.1:*",
                    "https://127.0.0.1:*",
                    
                    // ✅ PLATAFORMAS DE DESPLIEGUE
                    "https://*.netlify.app",
                    "https://*.vercel.app",
                    "https://*.onrender.com",
                    "https://*.herokuapp.com",
                    "https://*.github.io"
                );

        // ✅ ENDPOINT FALLBACK - Con SockJS para compatibilidad
        registry.addEndpoint("/ws-sockjs")
                .setAllowedOriginPatterns(
                    "http://localhost:*",
                    "https://localhost:*",
                    "http://127.0.0.1:*",
                    "https://127.0.0.1:*",
                    "https://*.netlify.app",
                    "https://*.vercel.app",
                    "https://*.onrender.com",
                    "https://*.herokuapp.com",
                    "https://*.github.io"
                )
                .withSockJS();
    }

    // ✅ OPCIONAL: TaskScheduler para heartbeat (si lo necesitas más adelante)
    @Bean
    public TaskScheduler heartBeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("websocket-heartbeat-");
        scheduler.initialize();
        return scheduler;
    }
}