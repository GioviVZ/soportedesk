package com.inia.soportedesk.usuariosred.contrato;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface UsuarioRedContratoRepository extends JpaRepository<UsuarioRedContrato, Long> {

    List<UsuarioRedContrato> findByUsuarioIgnoreCaseOrderByFechaInicioDesc(String usuario);

    @Query("SELECT c FROM UsuarioRedContrato c LEFT JOIN c.tipoContrato tc WHERE " +
           "LOWER(c.usuario) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.personalNombre) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.personalApellidos) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(CONCAT(CONCAT(COALESCE(c.personalNombre, ''), ' '), COALESCE(c.personalApellidos, ''))) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(CONCAT(CONCAT(COALESCE(c.personalApellidos, ''), ' '), COALESCE(c.personalNombre, ''))) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.numeroContrato) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(tc.nombre) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "ORDER BY c.fechaInicio DESC")
    List<UsuarioRedContrato> searchByPersonal(@Param("term") String term);

    @Query("SELECT c FROM UsuarioRedContrato c LEFT JOIN c.tipoContrato tc WHERE " +
           "LOWER(c.usuario) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.personalNombre) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.personalApellidos) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(CONCAT(CONCAT(COALESCE(c.personalNombre, ''), ' '), COALESCE(c.personalApellidos, ''))) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(CONCAT(CONCAT(COALESCE(c.personalApellidos, ''), ' '), COALESCE(c.personalNombre, ''))) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.numeroContrato) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(tc.nombre) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "ORDER BY c.fechaInicio DESC")
    List<UsuarioRedContrato> searchByPersonal(@Param("term") String term, Pageable pageable);

    @Query("SELECT c FROM UsuarioRedContrato c LEFT JOIN c.tipoContrato tc WHERE " +
           "LOWER(c.usuario) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.personalNombre) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.personalApellidos) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(CONCAT(CONCAT(COALESCE(c.personalNombre, ''), ' '), COALESCE(c.personalApellidos, ''))) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(CONCAT(CONCAT(COALESCE(c.personalApellidos, ''), ' '), COALESCE(c.personalNombre, ''))) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(c.numeroContrato) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(tc.nombre) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(COALESCE(c.registradoPor, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(COALESCE(c.actualizadoPor, '')) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "ORDER BY c.fechaInicio DESC")
    List<UsuarioRedContrato> searchAllFields(@Param("term") String term, Pageable pageable);

    @Query("""
            SELECT DISTINCT LOWER(c.usuario)
            FROM UsuarioRedContrato c
            LEFT JOIN c.tipoContrato tc
            WHERE (:q IS NULL OR
                   LOWER(COALESCE(c.usuario, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(c.personalNombre, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(c.personalApellidos, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(CONCAT(CONCAT(COALESCE(c.personalNombre, ''), ' '), COALESCE(c.personalApellidos, ''))) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(CONCAT(CONCAT(COALESCE(c.personalApellidos, ''), ' '), COALESCE(c.personalNombre, ''))) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(c.numeroContrato, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(tc.nombre, '')) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:nombre IS NULL OR
                   LOWER(COALESCE(c.personalNombre, '')) LIKE LOWER(CONCAT('%', :nombre, '%')) OR
                   LOWER(COALESCE(c.personalApellidos, '')) LIKE LOWER(CONCAT('%', :nombre, '%')) OR
                   LOWER(CONCAT(CONCAT(COALESCE(c.personalNombre, ''), ' '), COALESCE(c.personalApellidos, ''))) LIKE LOWER(CONCAT('%', :nombre, '%')) OR
                   LOWER(CONCAT(CONCAT(COALESCE(c.personalApellidos, ''), ' '), COALESCE(c.personalNombre, ''))) LIKE LOWER(CONCAT('%', :nombre, '%')))
            ORDER BY LOWER(c.usuario)
            """)
    List<String> findUsuariosForDirectorySearch(@Param("q") String q,
                                                 @Param("nombre") String nombre,
                                                 Pageable pageable);

    @Query("""
            SELECT MIN(c.fechaFin)
            FROM UsuarioRedContrato c
            WHERE c.fechaFin >= :desde
              AND c.fechaFin = (
                  SELECT MAX(c2.fechaFin)
                  FROM UsuarioRedContrato c2
                  WHERE LOWER(c2.usuario) = LOWER(c.usuario)
                    AND c2.fechaFin IS NOT NULL
              )
            """)
    LocalDate findProximoVencimientoUsuarioRed(@Param("desde") LocalDate desde);
}
