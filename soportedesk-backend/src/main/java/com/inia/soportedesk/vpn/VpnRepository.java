package com.inia.soportedesk.vpn;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VpnRepository extends JpaRepository<Vpn, Long> {

    long countByEstadoSolicitud(String estadoSolicitud);

    @Query("SELECT v.estadoSolicitud, COUNT(v) FROM Vpn v WHERE v.estadoSolicitud IS NOT NULL " +
           "GROUP BY v.estadoSolicitud ORDER BY COUNT(v) DESC")
    List<Object[]> countGroupedByEstadoSolicitud();

    @Query("SELECT COUNT(v) FROM Vpn v WHERE LOWER(v.adSamAccountName) = LOWER(:sam) " +
           "AND v.estadoSolicitud IN :states AND (:excludeId IS NULL OR v.id <> :excludeId)")
    long countBlockingByAdUser(@Param("sam") String sam,
                               @Param("states") List<String> states,
                               @Param("excludeId") Long excludeId);

    @Query("SELECT COUNT(v) FROM Vpn v WHERE LOWER(v.titularCorreo) = LOWER(:email) " +
           "AND v.estadoSolicitud IN :states AND (:excludeId IS NULL OR v.id <> :excludeId)")
    long countBlockingByExternalEmail(@Param("email") String email,
                                      @Param("states") List<String> states,
                                      @Param("excludeId") Long excludeId);

    @Query("SELECT COUNT(v) FROM Vpn v WHERE v.glpiComputerId = :computerId " +
           "AND v.estadoSolicitud IN :states AND (:excludeId IS NULL OR v.id <> :excludeId)")
    long countBlockingByGlpiComputer(@Param("computerId") Long computerId,
                                     @Param("states") List<String> states,
                                     @Param("excludeId") Long excludeId);

    @Query("SELECT COUNT(v) FROM Vpn v WHERE LOWER(v.usuarioVpn) = LOWER(:usuarioVpn) " +
           "AND v.estadoSolicitud = 'APROBADO' AND (:excludeId IS NULL OR v.id <> :excludeId)")
    long countApprovedByUsuarioVpn(@Param("usuarioVpn") String usuarioVpn,
                                   @Param("excludeId") Long excludeId);

    @Query("SELECT v FROM Vpn v WHERE " +
           "LOWER(COALESCE(v.adDisplayName, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(v.adSamAccountName, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(v.adMail, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(v.adOffice, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(v.adOrganizationalUnit, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(v.glpiNombreEquipo, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(v.tipoEquipo, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.usuarioVpn) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.solicitadoPorNombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Vpn> search(@Param("search") String search);
}
