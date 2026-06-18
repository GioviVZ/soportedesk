package com.inia.soportedesk.usuariosred;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UsuarioRedRepository extends JpaRepository<UsuarioRed, Long> {

    @Query("SELECT u FROM UsuarioRed u WHERE " +
           "LOWER(u.usuario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.apellidos) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.grupo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.unidadOrganizativa) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<UsuarioRed> search(@Param("search") String search);
}
