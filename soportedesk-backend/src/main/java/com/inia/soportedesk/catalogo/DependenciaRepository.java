package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DependenciaRepository extends JpaRepository<Dependencia, Long> {

    List<Dependencia> findBySedeId(Long sedeId);

    @Query("SELECT d FROM Dependencia d WHERE LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Dependencia> search(@Param("search") String search);

    @Query("SELECT d FROM Dependencia d WHERE d.sede.id = :sedeId AND LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Dependencia> searchBySedeId(@Param("sedeId") Long sedeId, @Param("search") String search);
}
