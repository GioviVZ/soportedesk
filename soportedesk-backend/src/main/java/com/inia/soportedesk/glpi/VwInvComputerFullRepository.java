package com.inia.soportedesk.glpi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VwInvComputerFullRepository extends JpaRepository<VwInvComputerFull, Long> {

    long countByEliminado(Integer eliminado);

    @Query("""
        SELECT v FROM VwInvComputerFull v
        WHERE v.eliminado = 0
          AND (:search IS NULL OR LOWER(v.nombreEquipo) LIKE LOWER(CONCAT('%', :search, '%'))
                               OR LOWER(v.usuarioContacto) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:sede IS NULL OR v.sedeNombre = :sede)
          AND (:tipo IS NULL OR v.tipoEquipo = :tipo)
          AND (:dependencia IS NULL OR v.oficinaId = :dependencia)
          AND (:subdependencia IS NULL OR v.unidadId = :subdependencia)
          AND (:fabricante IS NULL OR v.fabricanteEquipo = :fabricante)
        ORDER BY v.nombreEquipo
    """)
    List<VwInvComputerFull> findFiltered(
            @Param("search") String search,
            @Param("sede") String sede,
            @Param("tipo") String tipo,
            @Param("dependencia") String dependencia,
            @Param("subdependencia") String subdependencia,
            @Param("fabricante") String fabricante);

    @Query("""
        SELECT v FROM VwInvComputerFull v
        WHERE v.eliminado = 0
          AND (LOWER(v.nombreEquipo) = LOWER(:referencia)
               OR v.ipEquipo = :referencia)
        ORDER BY v.ultimaActualizacion DESC
    """)
    List<VwInvComputerFull> findByHostOrIp(@Param("referencia") String referencia);

    @Query("SELECT DISTINCT v.sedeNombre FROM VwInvComputerFull v WHERE v.eliminado = 0 AND v.sedeNombre IS NOT NULL ORDER BY v.sedeNombre")
    List<String> findDistinctSedes();

    @Query("SELECT DISTINCT v.tipoEquipo FROM VwInvComputerFull v WHERE v.eliminado = 0 AND v.tipoEquipo IS NOT NULL ORDER BY v.tipoEquipo")
    List<String> findDistinctTipos();

    @Query("""
        SELECT DISTINCT v.oficinaId FROM VwInvComputerFull v
        WHERE v.eliminado = 0
          AND v.oficinaId IS NOT NULL
          AND (:sede IS NULL OR v.sedeNombre = :sede)
        ORDER BY v.oficinaId
    """)
    List<String> findDistinctDependencias(@Param("sede") String sede);

    @Query("""
        SELECT DISTINCT v.unidadId FROM VwInvComputerFull v
        WHERE v.eliminado = 0
          AND v.unidadId IS NOT NULL
          AND (:sede IS NULL OR v.sedeNombre = :sede)
          AND (:dependencia IS NULL OR v.oficinaId = :dependencia)
        ORDER BY v.unidadId
    """)
    List<String> findDistinctSubdependencias(
            @Param("sede") String sede,
            @Param("dependencia") String dependencia);

    @Query("SELECT DISTINCT v.fabricanteEquipo FROM VwInvComputerFull v WHERE v.eliminado = 0 AND v.fabricanteEquipo IS NOT NULL ORDER BY v.fabricanteEquipo")
    List<String> findDistinctFabricantes();

    @Query("""
        SELECT v.tipoEquipo, COUNT(v) FROM VwInvComputerFull v
        WHERE v.eliminado = 0 AND v.tipoEquipo IS NOT NULL
        GROUP BY v.tipoEquipo ORDER BY COUNT(v) DESC
    """)
    List<Object[]> countGroupedByTipoEquipo();

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
