package com.inia.soportedesk.herramientas.ordenes;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdenServicioRepository extends JpaRepository<OrdenServicio, Long> {

    boolean existsByNumeroOrdenIgnoreCase(String numeroOrden);

    List<OrdenServicio> findAllByOrderByFinalizadaAscFechaVencimientoAsc();

    List<OrdenServicio> findAllByFinalizadaFalseOrderByFechaVencimientoAsc();
}
