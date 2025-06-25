package com.example.demo.chat.service;

import com.example.demo.chat.dto.EmisorCompletoDTO;
import com.example.demo.chat.dto.MensajeCompletoDTO;
import com.example.demo.chat.model.Mensaje;
import org.springframework.stereotype.Service;

@Service
public class MensajeTransformService {

    /**
     * Transforma un Mensaje de entidad a DTO completo para WebSocket
     * @param mensaje Entidad mensaje
     * @return DTO completo con emisor incluido
     */
    public MensajeCompletoDTO transformToCompleteDTO(Mensaje mensaje) {
        if (mensaje == null) {
            throw new IllegalArgumentException("El mensaje no puede ser null");
        }

        if (mensaje.getEmisor() == null) {
            throw new IllegalStateException("El mensaje debe tener un emisor válido");
        }

        // Crear DTO del emisor
        EmisorCompletoDTO emisorDTO = new EmisorCompletoDTO(
                mensaje.getEmisor().getId(),
                mensaje.getEmisor().getName(),
                mensaje.getEmisor().getEmail()
        );

        // Crear DTO del mensaje completo
        return new MensajeCompletoDTO(
                mensaje.getId(),
                mensaje.getContenido(),
                mensaje.isLeido(),
                mensaje.getTimestampEnvio().toString(),
                emisorDTO
        );
    }
}