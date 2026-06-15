package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SedeRepository extends JpaRepository<Sede, Long> {

    @Query("SELECT s FROM Sede s WHERE LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Sede> search(@Param("search") String search);
}
