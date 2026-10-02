package com.inia.soportedesk.telefoniafija;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TelefonoFijoRepository extends JpaRepository<TelefonoFijo, Long> {

    List<TelefonoFijo> findAllByOrderByIdDesc();

    List<TelefonoFijo> findByTipoOrderByIdDesc(TipoTelefonoFijo tipo);

    @Query("SELECT t FROM TelefonoFijo t "
            + "LEFT JOIN t.sede s LEFT JOIN t.dependencia d "
            + "WHERE (:tipo IS NULL OR t.tipo = :tipo) AND ("
            + "LOWER(t.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.serie) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.mac) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.ip) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.host) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.codigoPatrimonial) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.codigoInventario) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.referencia) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%'))) "
            + "ORDER BY t.id DESC")
    List<TelefonoFijo> search(
            @Param("tipo") TipoTelefonoFijo tipo,
            @Param("search") String search);

    boolean existsBySerieIgnoreCase(String serie);

    boolean existsBySerieIgnoreCaseAndIdNot(String serie, Long id);

    boolean existsByMacIgnoreCase(String mac);

    boolean existsByMacIgnoreCaseAndIdNot(String mac, Long id);

    boolean existsByIpIgnoreCase(String ip);

    boolean existsByIpIgnoreCaseAndIdNot(String ip, Long id);

    boolean existsByCodigoPatrimonialIgnoreCase(String codigoPatrimonial);

    boolean existsByCodigoPatrimonialIgnoreCaseAndIdNot(String codigoPatrimonial, Long id);

    boolean existsByCodigoInventarioIgnoreCase(String codigoInventario);

    boolean existsByCodigoInventarioIgnoreCaseAndIdNot(String codigoInventario, Long id);
}
