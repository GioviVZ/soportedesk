package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TipoImpresoraRepository extends JpaRepository<TipoImpresora, Long> {

    @Query("SELECT t FROM TipoImpresora t WHERE LOWER(t.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<TipoImpresora> search(@Param("search") String search);
}
