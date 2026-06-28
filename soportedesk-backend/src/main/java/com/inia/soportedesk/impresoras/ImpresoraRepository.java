package com.inia.soportedesk.impresoras;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ImpresoraRepository extends JpaRepository<Impresora, Long> {

    @Query("SELECT i FROM Impresora i " +
           "LEFT JOIN i.modeloImpresora mi LEFT JOIN mi.marca ma " +
           "LEFT JOIN i.sede s LEFT JOIN i.dependencia d WHERE " +
           "LOWER(ma.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(mi.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.serie) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.codigoInventario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.codigoPatrimonial) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Impresora> search(@Param("search") String search);
}
