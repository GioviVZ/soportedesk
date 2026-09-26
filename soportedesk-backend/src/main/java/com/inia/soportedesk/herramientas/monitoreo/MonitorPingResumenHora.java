package com.inia.soportedesk.herramientas.monitoreo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
        name = "monitor_ping_resumen_hora",
        uniqueConstraints = @UniqueConstraint(name = "UQ_monitor_ping_resumen_hora", columnNames = {"monitor_id", "hora"})
)
@Getter
@Setter
@NoArgsConstructor
public class MonitorPingResumenHora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "monitor_id", nullable = false)
    private MonitorPing monitor;

    @Column(nullable = false)
    private Instant hora;

    @Column(nullable = false)
    private Long muestras = 0L;

    @Column(nullable = false)
    private Long disponibles = 0L;

    @Column(name = "latencia_minima_ms")
    private Double latenciaMinimaMs;

    @Column(name = "latencia_promedio_ms")
    private Double latenciaPromedioMs;

    @Column(name = "latencia_maxima_ms")
    private Double latenciaMaximaMs;
}
