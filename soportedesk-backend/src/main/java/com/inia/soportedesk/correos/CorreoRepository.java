package com.inia.soportedesk.correos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CorreoRepository extends JpaRepository<Correo, Long> {

    @Query("SELECT c FROM Correo c WHERE " +
           "LOWER(c.usuario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.correo) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Correo> search(@Param("search") String search);
}
