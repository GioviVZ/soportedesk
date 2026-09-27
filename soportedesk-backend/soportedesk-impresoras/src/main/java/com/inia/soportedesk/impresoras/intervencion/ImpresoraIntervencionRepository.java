package com.inia.soportedesk.impresoras.intervencion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ImpresoraIntervencionRepository extends JpaRepository<ImpresoraIntervencion, Long> {
    List<ImpresoraIntervencion> findByImpresoraIdOrderByFechaDesc(Long impresoraId);
    Optional<ImpresoraIntervencion> findByIdAndImpresoraId(Long id, Long impresoraId);
}
