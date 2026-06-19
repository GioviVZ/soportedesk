package com.inia.soportedesk.usuariosred;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UsuarioRedRepository extends JpaRepository<UsuarioRed, Long> {

    @Query("SELECT u FROM UsuarioRed u " +
           "LEFT JOIN u.sede s " +
           "LEFT JOIN u.dependencia d " +
           "LEFT JOIN u.subdependencia sd " +
           "LEFT JOIN u.tipoContrato tc " +
           "WHERE " +
           "LOWER(u.usuario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.apellidos) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.grupo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.unidadOrganizativa) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.estado) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.numeroContrato) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(sd.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(tc.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<UsuarioRed> search(@Param("search") String search);

    @Query("SELECT COUNT(u) FROM UsuarioRed u WHERE u.estado IS NULL OR LOWER(u.estado) <> 'activo'")
    long countDesactivados();
}
