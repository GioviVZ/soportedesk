package com.inia.soportedesk.equipos.enrichment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EquipoEnrichmentRepository extends JpaRepository<EquipoEnrichment, Long> {
    Optional<EquipoEnrichment> findByComputerId(Long computerId);
    List<EquipoEnrichment> findByComputerIdIn(Collection<Long> computerIds);
}
