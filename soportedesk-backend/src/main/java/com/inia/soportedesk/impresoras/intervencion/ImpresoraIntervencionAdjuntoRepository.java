package com.inia.soportedesk.impresoras.intervencion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ImpresoraIntervencionAdjuntoRepository extends JpaRepository<ImpresoraIntervencionAdjunto, Long> {
    List<ImpresoraIntervencionAdjunto> findByIntervencionIdOrderByFechaSubidaAsc(Long intervencionId);
    Optional<ImpresoraIntervencionAdjunto> findByIdAndIntervencionId(Long id, Long intervencionId);
}
