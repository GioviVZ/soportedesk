package com.inia.soportedesk.impresoras;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ImpresoraRepository extends JpaRepository<Impresora, Long> {

    boolean existsBySerieIgnoreCase(String serie);

    boolean existsBySerieIgnoreCaseAndIdNot(String serie, Long id);

    boolean existsByCodigoInventarioIgnoreCase(String codigoInventario);

    boolean existsByCodigoInventarioIgnoreCaseAndIdNot(String codigoInventario, Long id);

    boolean existsByCodigoPatrimonialIgnoreCase(String codigoPatrimonial);

    boolean existsByCodigoPatrimonialIgnoreCaseAndIdNot(String codigoPatrimonial, Long id);

    boolean existsByIpIgnoreCase(String ip);

    boolean existsByIpIgnoreCaseAndIdNot(String ip, Long id);

    @Query("SELECT i FROM Impresora i " +
           "LEFT JOIN i.modeloImpresora mi LEFT JOIN mi.marca ma " +
           "LEFT JOIN i.sede s LEFT JOIN i.dependencia d WHERE " +
           "LOWER(ma.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(mi.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.serie) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.codigoInventario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.codigoPatrimonial) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.referencia) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Impresora> search(@Param("search") String search);

    @Query("SELECT i.estado, COUNT(i) FROM Impresora i WHERE i.estado IS NOT NULL " +
           "GROUP BY i.estado ORDER BY COUNT(i) DESC")
    List<Object[]> countGroupedByEstado();
}
