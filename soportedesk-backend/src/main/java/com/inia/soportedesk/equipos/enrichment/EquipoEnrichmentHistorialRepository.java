package com.inia.soportedesk.equipos.enrichment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipoEnrichmentHistorialRepository extends JpaRepository<EquipoEnrichmentHistorial, Long> {
    List<EquipoEnrichmentHistorial> findByComputerIdOrderByFechaModificacionDesc(Long computerId);
}
