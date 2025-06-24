package com.example.demo.chat.repository;

import com.example.demo.chat.model.Conversacion;
import com.example.demo.chat.model.Mensaje;
import com.example.demo.user.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MensajeRepository extends JpaRepository<Mensaje, Long> {

    // Últimos 20 mensajes
    List<Mensaje> findTop20ByConversacionOrderByTimestampEnvioDesc(Conversacion conversacion);

    //  Paginación con Spring Data
    Page<Mensaje> findByConversacionOrderByTimestampEnvioDesc(Conversacion conversacion, Pageable pageable);

    // Query personalizada para mejor control
    @Query("SELECT m FROM Mensaje m WHERE m.conversacion = :conversacion ORDER BY m.timestampEnvio DESC")
    Page<Mensaje> findMensajesPaginados(@Param("conversacion") Conversacion conversacion, Pageable pageable);

    // Mensajes no leídos
    List<Mensaje> findByConversacionAndEmisorNotAndLeidoFalse(Conversacion conversacion, User emisor);
}