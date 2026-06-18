package com.inia.soportedesk.equipos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EquipoRepository extends JpaRepository<Equipo, Long> {

    List<Equipo> findByTipoIn(List<String> tipos);

    @Query("SELECT e FROM Equipo e LEFT JOIN e.usuarioRed u LEFT JOIN e.sede s LEFT JOIN e.dependencia d WHERE " +
           "LOWER(e.numeroSerie) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.codigoPatrimonial) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Equipo> search(@Param("search") String search);
}
