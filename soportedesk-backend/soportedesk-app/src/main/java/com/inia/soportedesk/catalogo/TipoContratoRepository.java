package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TipoContratoRepository extends JpaRepository<TipoContrato, Long> {

    @Query("SELECT t FROM TipoContrato t WHERE LOWER(t.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<TipoContrato> search(@Param("search") String search);
}
