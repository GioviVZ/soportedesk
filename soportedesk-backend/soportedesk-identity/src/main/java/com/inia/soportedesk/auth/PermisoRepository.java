package com.inia.soportedesk.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermisoRepository extends JpaRepository<Permiso, Long> {
    List<Permiso> findByUsuario(Usuario usuario);
    void deleteByUsuario(Usuario usuario);
}
