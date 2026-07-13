package com.inia.soportedesk.usuariosred.contrato;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UsuarioRedContratoRepository extends JpaRepository<UsuarioRedContrato, Long> {

    List<UsuarioRedContrato> findByUsuarioIgnoreCaseOrderByFechaInicioDesc(String usuario);

    @Query("SELECT c FROM UsuarioRedContrato c LEFT JOIN c.tipoContrato tc WHERE " +
           "LOWER(c.usuario) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.personalNombre) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.personalApellidos) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.numeroContrato) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(tc.nombre) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "ORDER BY c.fechaInicio DESC")
    List<UsuarioRedContrato> searchByPersonal(@Param("term") String term);

    @Query("SELECT c FROM UsuarioRedContrato c LEFT JOIN c.tipoContrato tc WHERE " +
           "LOWER(c.usuario) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.personalNombre) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.personalApellidos) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.numeroContrato) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(tc.nombre) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "ORDER BY c.fechaInicio DESC")
    List<UsuarioRedContrato> searchByPersonal(@Param("term") String term, Pageable pageable);

    @Query("SELECT c FROM UsuarioRedContrato c LEFT JOIN c.tipoContrato tc WHERE " +
           "LOWER(c.usuario) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.personalNombre) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.personalApellidos) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.numeroContrato) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(tc.nombre) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(COALESCE(c.registradoPor, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(COALESCE(c.actualizadoPor, '')) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "ORDER BY c.fechaInicio DESC")
    List<UsuarioRedContrato> searchAllFields(@Param("term") String term, Pageable pageable);
}
