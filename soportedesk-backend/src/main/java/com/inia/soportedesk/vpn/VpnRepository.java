package com.inia.soportedesk.vpn;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VpnRepository extends JpaRepository<Vpn, Long> {

    Optional<Vpn> findFirstByEquipoId(Long equipoId);

    Optional<Vpn> findFirstByUsuarioRedId(Long usuarioRedId);

    long countByEstadoSolicitud(String estadoSolicitud);

    @Query("SELECT v FROM Vpn v LEFT JOIN v.usuarioRed u LEFT JOIN v.equipo e WHERE " +
           "LOWER(u.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.usuario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(v.adDisplayName, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(v.adSamAccountName, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(v.adMail, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(v.adOffice, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(v.adOrganizationalUnit, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.usuarioVpn) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.solicitadoPorNombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Vpn> search(@Param("search") String search);
}
