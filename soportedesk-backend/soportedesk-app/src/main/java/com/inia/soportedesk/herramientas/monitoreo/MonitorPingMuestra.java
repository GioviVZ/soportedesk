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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "monitor_ping_muestras")
@Getter
@Setter
@NoArgsConstructor
public class MonitorPingMuestra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "monitor_id", nullable = false)
    private MonitorPing monitor;

    @Column(nullable = false)
    private Instant fecha;

    @Column(nullable = false)
    private Boolean disponible;

    @Column(name = "latencia_ms")
    private Double latenciaMs;
}
