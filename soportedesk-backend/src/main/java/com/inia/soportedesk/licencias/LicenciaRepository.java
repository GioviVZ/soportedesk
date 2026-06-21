package com.inia.soportedesk.licencias;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LicenciaRepository extends JpaRepository<Licencia, Long> {

    @Query("SELECT l FROM Licencia l WHERE " +
           "LOWER(l.descripcion) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.cuentaActivacion) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.serialActivacion) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.ordenCompra) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.anio) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.tipoLicencia.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.tipoBien.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Licencia> search(@Param("search") String search);
}
