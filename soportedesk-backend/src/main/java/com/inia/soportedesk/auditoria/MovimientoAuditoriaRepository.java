package com.inia.soportedesk.auditoria;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MovimientoAuditoriaRepository extends JpaRepository<MovimientoAuditoria, Long> {

    @Query("""
            SELECT m FROM MovimientoAuditoria m
            WHERE (:modulo IS NULL OR m.modulo = :modulo)
              AND (:accion IS NULL OR m.accion = :accion)
              AND (:search IS NULL OR LOWER(m.usuario) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(m.detalle) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(m.ruta) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:desde IS NULL OR m.fecha >= :desde)
              AND (:hasta IS NULL OR m.fecha <= :hasta)
            ORDER BY m.fecha DESC
            """)
    List<MovimientoAuditoria> buscar(
            @Param("modulo") String modulo,
            @Param("accion") String accion,
            @Param("search") String search,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            Pageable pageable
    );
}
