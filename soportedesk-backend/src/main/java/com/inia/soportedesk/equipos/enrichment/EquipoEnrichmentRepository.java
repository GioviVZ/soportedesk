package com.inia.soportedesk.equipos.enrichment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EquipoEnrichmentRepository extends JpaRepository<EquipoEnrichment, Long> {
    Optional<EquipoEnrichment> findByComputerId(Long computerId);
    List<EquipoEnrichment> findByComputerIdIn(Collection<Long> computerIds);
    boolean existsByCodigoInternoOverrideIgnoreCaseAndComputerIdNot(String codigoInterno, Long computerId);
    boolean existsByCodigoPatrimonialIgnoreCaseAndComputerIdNot(String codigoPatrimonial, Long computerId);
    boolean existsByMonitorCodigoInternoOverrideIgnoreCaseAndComputerIdNot(String codigoInterno, Long computerId);
    boolean existsByMonitorCodigoPatrimonialIgnoreCaseAndComputerIdNot(String codigoPatrimonial, Long computerId);
    boolean existsByMonitor2CodigoInternoOverrideIgnoreCaseAndComputerIdNot(String codigoInterno, Long computerId);
    boolean existsByMonitor2CodigoPatrimonialIgnoreCaseAndComputerIdNot(String codigoPatrimonial, Long computerId);
}
