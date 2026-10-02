package com.inia.soportedesk.equiposmoviles;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EquipoMovilRepository extends JpaRepository<EquipoMovil, Long> {

    List<EquipoMovil> findAllByOrderByIdDesc();

    List<EquipoMovil> findByTipoOrderByIdDesc(TipoEquipoMovil tipo);

    @Query("SELECT e FROM EquipoMovil e "
            + "LEFT JOIN e.sede s LEFT JOIN e.dependencia d "
            + "WHERE (:tipo IS NULL OR e.tipo = :tipo) AND ("
            + "LOWER(e.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.serie) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.imei1) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.imei2) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.mac) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.codigoPatrimonial) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.codigoInventario) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.referencia) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%'))) "
            + "ORDER BY e.id DESC")
    List<EquipoMovil> search(
            @Param("tipo") TipoEquipoMovil tipo,
            @Param("search") String search);

    boolean existsBySerieIgnoreCase(String serie);

    boolean existsBySerieIgnoreCaseAndIdNot(String serie, Long id);

    boolean existsByMacIgnoreCase(String mac);

    boolean existsByMacIgnoreCaseAndIdNot(String mac, Long id);

    boolean existsByCodigoPatrimonialIgnoreCase(String codigoPatrimonial);

    boolean existsByCodigoPatrimonialIgnoreCaseAndIdNot(String codigoPatrimonial, Long id);

    boolean existsByCodigoInventarioIgnoreCase(String codigoInventario);

    boolean existsByCodigoInventarioIgnoreCaseAndIdNot(String codigoInventario, Long id);

    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM EquipoMovil e "
            + "WHERE (:currentId IS NULL OR e.id <> :currentId) "
            + "AND (e.imei1 = :imei OR e.imei2 = :imei)")
    boolean existsImeiOnOtherEquipo(
            @Param("imei") String imei,
            @Param("currentId") Long currentId);
}
