package com.inia.soportedesk.equipos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EquipoRepository extends JpaRepository<Equipo, Long> {

    @Query("SELECT e FROM Equipo e WHERE " +
           "LOWER(e.codigo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.usuario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.area) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Equipo> search(@Param("search") String search);
}
