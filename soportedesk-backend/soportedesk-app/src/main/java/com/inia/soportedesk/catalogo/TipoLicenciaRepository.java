package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TipoLicenciaRepository extends JpaRepository<TipoLicencia, Long> {

    @Query("SELECT t FROM TipoLicencia t WHERE LOWER(t.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<TipoLicencia> search(@Param("search") String search);
}
