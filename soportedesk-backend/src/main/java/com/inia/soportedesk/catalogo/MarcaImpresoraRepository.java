package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MarcaImpresoraRepository extends JpaRepository<MarcaImpresora, Long> {

    @Query("SELECT m FROM MarcaImpresora m WHERE LOWER(m.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<MarcaImpresora> search(@Param("search") String search);
}
