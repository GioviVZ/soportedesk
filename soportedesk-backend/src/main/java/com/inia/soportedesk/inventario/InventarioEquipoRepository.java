package com.inia.soportedesk.inventario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InventarioEquipoRepository extends JpaRepository<InventarioEquipo, Long> {

    Optional<InventarioEquipo> findFirstBySerialEquipoIgnoreCase(String serialEquipo);

    Optional<InventarioEquipo> findFirstByAgentId(String agentId);

    Optional<InventarioEquipo> findFirstByHostnameIgnoreCaseAndDominioIgnoreCase(String hostname, String dominio);

    @Query("""
            SELECT e FROM InventarioEquipo e
            WHERE :search IS NULL OR :search = ''
               OR LOWER(e.hostname) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(e.serialEquipo) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(e.usuarioActual) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(e.dominio) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(e.ou) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(e.fabricante) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(e.modelo) LIKE LOWER(CONCAT('%', :search, '%'))
            ORDER BY e.ultimoReporte DESC, e.hostname ASC
            """)
    List<InventarioEquipo> search(String search);
}
