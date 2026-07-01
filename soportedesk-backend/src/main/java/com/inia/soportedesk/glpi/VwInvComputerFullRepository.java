package com.inia.soportedesk.glpi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VwInvComputerFullRepository extends JpaRepository<VwInvComputerFull, Long> {

    @Query("""
        SELECT v FROM VwInvComputerFull v
        WHERE v.eliminado = 0
          AND (:search IS NULL OR LOWER(v.nombreEquipo) LIKE LOWER(CONCAT('%', :search, '%'))
                               OR LOWER(v.usuarioContacto) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:sede IS NULL OR v.sedeNombre = :sede)
          AND (:tipo IS NULL OR v.tipoEquipo = :tipo)
        ORDER BY v.nombreEquipo
    """)
    List<VwInvComputerFull> findFiltered(
            @Param("search") String search,
            @Param("sede") String sede,
            @Param("tipo") String tipo);

    @Query("SELECT DISTINCT v.sedeNombre FROM VwInvComputerFull v WHERE v.eliminado = 0 AND v.sedeNombre IS NOT NULL ORDER BY v.sedeNombre")
    List<String> findDistinctSedes();

    @Query("SELECT DISTINCT v.tipoEquipo FROM VwInvComputerFull v WHERE v.eliminado = 0 AND v.tipoEquipo IS NOT NULL ORDER BY v.tipoEquipo")
    List<String> findDistinctTipos();

    @Query(value = """
        SELECT s.name AS software, sv.name AS version, iss.date_install AS fechaInstalacion
        FROM glpi_items_softwareversions iss
        JOIN glpi_softwareversions sv ON sv.id = iss.softwareversions_id
        JOIN glpi_softwares s ON s.id = sv.softwares_id
        WHERE iss.itemtype = 'Computer'
          AND iss.items_id = :computerId
          AND iss.is_deleted = 0
        ORDER BY s.name
    """, nativeQuery = true)
    List<SoftwareRow> findSoftwareByComputerId(@Param("computerId") Long computerId);
}
