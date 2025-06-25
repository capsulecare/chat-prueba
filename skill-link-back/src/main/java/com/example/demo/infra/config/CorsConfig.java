package com.example.demo.infra.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ✅ ORÍGENES PERMITIDOS - INCLUIR TU FRONTEND DESPLEGADO
        configuration.setAllowedOriginPatterns(Arrays.asList(
                // ✅ DESARROLLO LOCAL
                "http://localhost:*",
                "https://localhost:*",
                "http://127.0.0.1:*",
                "https://127.0.0.1:*",
                
                // ✅ PLATAFORMAS DE DESPLIEGUE COMUNES
                "https://*.netlify.app",
                "https://*.vercel.app",
                "https://*.onrender.com",
                "https://*.herokuapp.com",
                "https://*.github.io",
                
                // ✅ AGREGAR AQUÍ TU DOMINIO ESPECÍFICO CUANDO LO TENGAS
                "https://tu-frontend-desplegado.com"
        ));

        // ✅ MÉTODOS HTTP PERMITIDOS
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));

        // ✅ HEADERS PERMITIDOS
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // ✅ HEADERS EXPUESTOS
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));

        // ✅ PERMITIR CREDENCIALES (necesario para JWT)
        configuration.setAllowCredentials(true);

        // ✅ TIEMPO DE CACHE PARA PREFLIGHT REQUESTS
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}