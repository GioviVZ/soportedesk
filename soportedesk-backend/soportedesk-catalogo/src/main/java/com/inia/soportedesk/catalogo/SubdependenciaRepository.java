package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubdependenciaRepository extends JpaRepository<Subdependencia, Long> {

    List<Subdependencia> findByDependenciaId(Long dependenciaId);

    @Query("SELECT s FROM Subdependencia s WHERE LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Subdependencia> search(@Param("search") String search);

    @Query("SELECT s FROM Subdependencia s WHERE s.dependencia.id = :dependenciaId AND LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Subdependencia> searchByDependenciaId(@Param("dependenciaId") Long dependenciaId, @Param("search") String search);
}
