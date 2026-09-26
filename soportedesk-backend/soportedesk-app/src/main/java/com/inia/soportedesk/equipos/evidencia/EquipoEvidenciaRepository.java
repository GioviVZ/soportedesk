package com.inia.soportedesk.equipos.evidencia;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquipoEvidenciaRepository extends JpaRepository<EquipoEvidencia, Long> {
    List<EquipoEvidencia> findByComputerIdOrderByFechaSubidaDesc(Long computerId);
    Optional<EquipoEvidencia> findByIdAndComputerId(Long id, Long computerId);
}
