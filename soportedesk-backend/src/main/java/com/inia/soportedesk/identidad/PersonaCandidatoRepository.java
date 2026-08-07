package com.inia.soportedesk.identidad;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PersonaCandidatoRepository extends JpaRepository<PersonaCandidato, Long> {

    boolean existsBySamAccountName(String samAccountName);

    List<PersonaCandidato> findByEstadoOrderByClasificacionSugeridaAscFechaDeteccionDesc(String estado);

    Optional<PersonaCandidato> findBySamAccountName(String samAccountName);
}
