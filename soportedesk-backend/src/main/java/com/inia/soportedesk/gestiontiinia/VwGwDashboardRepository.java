package com.inia.soportedesk.gestiontiinia;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VwGwDashboardRepository extends JpaRepository<VwGwDashboard, String> {

    boolean existsByEmailIgnoreCase(String email);

    @Query("""
        SELECT v FROM VwGwDashboard v
        WHERE (:search IS NULL OR :search = ''
               OR LOWER(v.email) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(v.nombreCompleto) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:sede IS NULL OR :sede = '' OR v.sede = :sede)
          AND (:dependencia IS NULL OR :dependencia = '' OR v.oficinaPadre = :dependencia)
          AND (:subdependencia IS NULL OR :subdependencia = '' OR v.oficina = :subdependencia)
          AND (:estado IS NULL OR :estado = '' OR v.estado = :estado)
          AND (:modalidad IS NULL OR :modalidad = '' OR v.modalidad = :modalidad)
          AND (:sinUsoDesde IS NULL OR v.ultimoInicioSesion IS NULL OR v.ultimoInicioSesion < :sinUsoDesde)
        ORDER BY v.sede ASC, v.nombreCompleto ASC
    """)
    List<VwGwDashboard> findFiltered(
            @Param("search") String search,
            @Param("sede") String sede,
            @Param("dependencia") String dependencia,
            @Param("subdependencia") String subdependencia,
            @Param("estado") String estado,
            @Param("modalidad") String modalidad,
            @Param("sinUsoDesde") LocalDateTime sinUsoDesde
    );

    @Query("SELECT DISTINCT v.sede FROM VwGwDashboard v WHERE v.sede IS NOT NULL ORDER BY v.sede ASC")
    List<String> findDistinctSedes();

    @Query("SELECT DISTINCT v.oficinaPadre FROM VwGwDashboard v WHERE v.oficinaPadre IS NOT NULL ORDER BY v.oficinaPadre ASC")
    List<String> findDistinctDependencias();

    @Query("""
        SELECT DISTINCT v.oficina FROM VwGwDashboard v
        WHERE v.oficina IS NOT NULL
          AND (:dependencia IS NULL OR :dependencia = '' OR v.oficinaPadre = :dependencia)
        ORDER BY v.oficina ASC
    """)
    List<String> findDistinctSubdependencias(@Param("dependencia") String dependencia);

    @Query("""
        SELECT v FROM VwGwDashboard v
        WHERE v.categoria = :categoria
        ORDER BY v.nombreCompleto ASC
    """)
    List<VwGwDashboard> findByCategoria(@Param("categoria") String categoria);
}
