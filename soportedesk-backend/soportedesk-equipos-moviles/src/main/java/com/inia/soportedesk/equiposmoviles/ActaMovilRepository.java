package com.inia.soportedesk.equiposmoviles;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ActaMovilRepository extends JpaRepository<ActaMovil, Long> {

    List<ActaMovil> findAllByOrderByIdDesc();

    @Query("SELECT DISTINCT a FROM ActaMovil a "
            + "LEFT JOIN a.dependencia d LEFT JOIN a.equipos e "
            + "WHERE (:tipo IS NULL OR a.tipo = :tipo) "
            + "AND (:desde IS NULL OR a.fecha >= :desde) "
            + "AND (:hasta IS NULL OR a.fecha <= :hasta) "
            + "AND (:search = '' OR "
            + "LOWER(a.numeroActa) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(a.personaNombre) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(a.personaDni) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.imei1) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.imei2) LIKE LOWER(CONCAT('%', :search, '%'))) "
            + "ORDER BY a.id DESC")
    List<ActaMovil> search(
            @Param("search") String search,
            @Param("tipo") String tipo,
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta);

    boolean existsByNumeroActaIgnoreCase(String numeroActa);

    boolean existsByNumeroActaIgnoreCaseAndIdNot(String numeroActa, Long id);

    boolean existsByEquiposId(Long equipoMovilId);
}
