package com.inia.soportedesk.herramientas.monitoreo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface MonitorPingMuestraRepository extends JpaRepository<MonitorPingMuestra, Long> {

    List<MonitorPingMuestra> findByMonitorIdAndFechaBetweenOrderByFechaAsc(
            Long monitorId, Instant desde, Instant hasta);

    long countByMonitorIdAndFechaGreaterThanEqualAndFechaLessThanAndLatenciaMsIsNotNull(
            Long monitorId, Instant desde, Instant hasta);

    @Modifying
    @Query("delete from MonitorPingMuestra m where m.fecha < :limite")
    int deleteAnterioresA(@Param("limite") Instant limite);
}
