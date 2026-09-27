package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TipoBienRepository extends JpaRepository<TipoBien, Long> {

    @Query("SELECT t FROM TipoBien t WHERE LOWER(t.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<TipoBien> search(@Param("search") String search);
}
