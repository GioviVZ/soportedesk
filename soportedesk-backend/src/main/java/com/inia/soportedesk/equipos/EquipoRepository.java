package com.inia.soportedesk.equipos;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipoRepository extends JpaRepository<Equipo, Long> {

    List<Equipo> findByTipoIn(List<String> tipos);
}
