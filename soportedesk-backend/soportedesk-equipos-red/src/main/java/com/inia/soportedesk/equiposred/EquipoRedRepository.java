package com.inia.soportedesk.equiposred;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EquipoRedRepository extends JpaRepository<EquipoRed, Long> {

    List<EquipoRed> findByTipoOrderByIdDesc(TipoEquipoRed tipo);

    @Query("SELECT e FROM EquipoRed e "
            + "LEFT JOIN e.sede s LEFT JOIN e.dependencia d "
            + "WHERE e.tipo = :tipo AND ("
            + "LOWER(e.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.serie) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.codigoPatrimonial) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.codigoInventario) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.etiqueta) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.ip) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.mac) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.host) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.referencia) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%'))) "
            + "ORDER BY e.id DESC")
    List<EquipoRed> search(@Param("tipo") TipoEquipoRed tipo, @Param("search") String search);

    boolean existsBySerieIgnoreCase(String serie);

    boolean existsBySerieIgnoreCaseAndIdNot(String serie, Long id);

    boolean existsByCodigoPatrimonialIgnoreCase(String codigoPatrimonial);

    boolean existsByCodigoPatrimonialIgnoreCaseAndIdNot(String codigoPatrimonial, Long id);

    boolean existsByCodigoInventarioIgnoreCase(String codigoInventario);

    boolean existsByCodigoInventarioIgnoreCaseAndIdNot(String codigoInventario, Long id);

    boolean existsByIpIgnoreCase(String ip);

    boolean existsByIpIgnoreCaseAndIdNot(String ip, Long id);

    boolean existsByMacIgnoreCase(String mac);

    boolean existsByMacIgnoreCaseAndIdNot(String mac, Long id);
}
