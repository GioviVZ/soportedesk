package com.inia.soportedesk.herramientas.monitoreo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface MonitorPingResumenHoraRepository extends JpaRepository<MonitorPingResumenHora, Long> {

    Optional<MonitorPingResumenHora> findByMonitorIdAndHora(Long monitorId, Instant hora);

    List<MonitorPingResumenHora> findByMonitorIdAndHoraBetweenOrderByHoraAsc(
            Long monitorId, Instant desde, Instant hasta);

    @Modifying
    @Query("delete from MonitorPingResumenHora r where r.hora < :limite")
    int deleteAnterioresA(@Param("limite") Instant limite);
}
