package com.inia.soportedesk.herramientas.monitoreo;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

public interface MonitorPingRepository extends JpaRepository<MonitorPing, Long> {

    List<MonitorPing> findAllByOrderByNombreAsc();

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);

    long countByEstado(MonitorPingEstado estado);

    @Query("""
            select m from MonitorPing m
            where m.estado = :estado
              and (m.proximaMedicion is null or m.proximaMedicion <= :ahora)
            order by m.proximaMedicion asc, m.id asc
            """)
    List<MonitorPing> findPendientes(@Param("estado") MonitorPingEstado estado,
                                     @Param("ahora") Instant ahora,
                                     Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("""
            update MonitorPing m
               set m.proximaMedicion = :siguiente
             where m.id = :id
               and m.estado = :estado
               and (m.proximaMedicion is null or m.proximaMedicion <= :ahora)
            """)
    int reclamar(@Param("id") Long id,
                 @Param("estado") MonitorPingEstado estado,
                 @Param("ahora") Instant ahora,
                 @Param("siguiente") Instant siguiente);
}
