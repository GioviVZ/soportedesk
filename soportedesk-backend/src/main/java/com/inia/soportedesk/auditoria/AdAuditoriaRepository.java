package com.inia.soportedesk.auditoria;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AdAuditoriaRepository extends JpaRepository<AdAuditoria, Long> {

    @Query("""
            SELECT a FROM AdAuditoria a
            WHERE (:usuarioAfectado IS NULL OR LOWER(a.usuarioAfectado) LIKE LOWER(CONCAT('%', :usuarioAfectado, '%')))
              AND (:accion IS NULL OR a.accion = :accion)
              AND (:resultado IS NULL OR a.resultado = :resultado)
              AND (:desde IS NULL OR a.fechaRegistro >= :desde)
              AND (:hasta IS NULL OR a.fechaRegistro <= :hasta)
            ORDER BY a.fechaRegistro DESC
            """)
    List<AdAuditoria> buscar(
            @Param("usuarioAfectado") String usuarioAfectado,
            @Param("accion") String accion,
            @Param("resultado") String resultado,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            Pageable pageable
    );
}
