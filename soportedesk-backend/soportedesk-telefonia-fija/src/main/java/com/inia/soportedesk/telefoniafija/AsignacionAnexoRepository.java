package com.inia.soportedesk.telefoniafija;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AsignacionAnexoRepository extends JpaRepository<AsignacionAnexo, Long> {

    @Query("SELECT a FROM AsignacionAnexo a "
            + "JOIN a.telefonoFijo t LEFT JOIN t.sede s LEFT JOIN a.dependencia d "
            + "WHERE (:sedeId IS NULL OR s.id = :sedeId) "
            + "AND (:estado IS NULL OR a.estado = :estado) "
            + "AND (:search = '' OR "
            + "LOWER(a.anexo) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(a.numeroDirecto) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(a.personaNombre) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(a.personaDni) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.ip) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.mac) LIKE LOWER(CONCAT('%', :search, '%'))) "
            + "ORDER BY a.id DESC")
    List<AsignacionAnexo> search(
            @Param("search") String search,
            @Param("sedeId") Long sedeId,
            @Param("estado") String estado);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM AsignacionAnexo a "
            + "WHERE a.estado = 'Activa' AND a.anexo = :anexo "
            + "AND (:currentId IS NULL OR a.id <> :currentId)")
    boolean existsActiveAnexo(
            @Param("anexo") String anexo,
            @Param("currentId") Long currentId);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM AsignacionAnexo a "
            + "WHERE a.estado = 'Activa' AND a.numeroDirecto = :numeroDirecto "
            + "AND (:currentId IS NULL OR a.id <> :currentId)")
    boolean existsActiveNumeroDirecto(
            @Param("numeroDirecto") String numeroDirecto,
            @Param("currentId") Long currentId);

    boolean existsByTelefonoFijoId(Long telefonoFijoId);

    boolean existsByTelefonoFijoIdAndEstado(Long telefonoFijoId, String estado);
}
