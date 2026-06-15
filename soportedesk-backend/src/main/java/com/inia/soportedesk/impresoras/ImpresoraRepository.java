package com.inia.soportedesk.impresoras;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ImpresoraRepository extends JpaRepository<Impresora, Long> {

    @Query("SELECT i FROM Impresora i WHERE " +
           "LOWER(i.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.area) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Impresora> search(@Param("search") String search);
}
