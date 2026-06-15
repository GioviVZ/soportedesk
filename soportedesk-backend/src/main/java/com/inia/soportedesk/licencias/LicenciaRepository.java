package com.inia.soportedesk.licencias;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LicenciaRepository extends JpaRepository<Licencia, Long> {

    @Query("SELECT l FROM Licencia l WHERE " +
           "LOWER(l.licencia) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.correo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.clave) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.ordenCompra) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.anio) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Licencia> search(@Param("search") String search);
}
