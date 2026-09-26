package com.inia.soportedesk.equipos.glpicache;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EquipoGlpiCacheRepository extends JpaRepository<EquipoGlpiCache, Long> {

    @Query("""
        SELECT v FROM EquipoGlpiCache v
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
    List<EquipoGlpiCache> findFiltered(
            @Param("search") String search,
            @Param("sede") String sede,
            @Param("tipo") String tipo,
            @Param("dependencia") String dependencia,
            @Param("subdependencia") String subdependencia,
            @Param("fabricante") String fabricante);

    @Query("SELECT DISTINCT v.sedeNombre FROM EquipoGlpiCache v WHERE v.eliminado = 0 AND v.sedeNombre IS NOT NULL ORDER BY v.sedeNombre")
    List<String> findDistinctSedes();

    @Query("SELECT DISTINCT v.tipoEquipo FROM EquipoGlpiCache v WHERE v.eliminado = 0 AND v.tipoEquipo IS NOT NULL ORDER BY v.tipoEquipo")
    List<String> findDistinctTipos();

    @Query("""
        SELECT DISTINCT v.oficinaId FROM EquipoGlpiCache v
        WHERE v.eliminado = 0
          AND v.oficinaId IS NOT NULL
          AND (:sede IS NULL OR v.sedeNombre = :sede)
        ORDER BY v.oficinaId
    """)
    List<String> findDistinctDependencias(@Param("sede") String sede);

    @Query("""
        SELECT DISTINCT v.unidadId FROM EquipoGlpiCache v
        WHERE v.eliminado = 0
          AND v.unidadId IS NOT NULL
          AND (:sede IS NULL OR v.sedeNombre = :sede)
          AND (:dependencia IS NULL OR v.oficinaId = :dependencia)
        ORDER BY v.unidadId
    """)
    List<String> findDistinctSubdependencias(
            @Param("sede") String sede,
            @Param("dependencia") String dependencia);

    @Query("SELECT DISTINCT v.fabricanteEquipo FROM EquipoGlpiCache v WHERE v.eliminado = 0 AND v.fabricanteEquipo IS NOT NULL ORDER BY v.fabricanteEquipo")
    List<String> findDistinctFabricantes();

    @Modifying
    @Transactional
    @Query("DELETE FROM EquipoGlpiCache c WHERE c.syncedAt < :cutoff")
    int deleteBySyncedAtBefore(@Param("cutoff") LocalDateTime cutoff);
}
