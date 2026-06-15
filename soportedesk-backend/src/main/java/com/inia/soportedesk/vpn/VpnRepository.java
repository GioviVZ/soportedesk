package com.inia.soportedesk.vpn;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VpnRepository extends JpaRepository<Vpn, Long> {

    @Query("SELECT v FROM Vpn v WHERE " +
           "LOWER(v.usuario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.tipo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.ipAsignada) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Vpn> search(@Param("search") String search);
}
