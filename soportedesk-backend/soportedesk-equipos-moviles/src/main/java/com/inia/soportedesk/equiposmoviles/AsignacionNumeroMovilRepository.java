package com.inia.soportedesk.equiposmoviles;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AsignacionNumeroMovilRepository extends JpaRepository<AsignacionNumeroMovil, Long> {

    @Query("SELECT a FROM AsignacionNumeroMovil a "
            + "JOIN a.equipoMovil e LEFT JOIN a.dependencia d "
            + "WHERE (:operador IS NULL OR a.operador = :operador) "
            + "AND (:estado IS NULL OR a.estado = :estado) "
            + "AND (:search = '' OR "
            + "LOWER(a.numero) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(a.plan) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(a.simIccid) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(a.personaNombre) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(a.personaDni) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.imei1) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.imei2) LIKE LOWER(CONCAT('%', :search, '%'))) "
            + "ORDER BY a.id DESC")
    List<AsignacionNumeroMovil> search(
            @Param("search") String search,
            @Param("operador") String operador,
            @Param("estado") String estado);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM AsignacionNumeroMovil a "
            + "WHERE a.estado = 'Activa' AND a.numero = :numero "
            + "AND (:currentId IS NULL OR a.id <> :currentId)")
    boolean existsActiveNumero(
            @Param("numero") String numero,
            @Param("currentId") Long currentId);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM AsignacionNumeroMovil a "
            + "WHERE a.estado = 'Activa' AND a.simIccid = :simIccid "
            + "AND (:currentId IS NULL OR a.id <> :currentId)")
    boolean existsActiveIccid(
            @Param("simIccid") String simIccid,
            @Param("currentId") Long currentId);

    boolean existsByEquipoMovilId(Long equipoMovilId);

    boolean existsByEquipoMovilIdAndEstado(Long equipoMovilId, String estado);
}
