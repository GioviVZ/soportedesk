package com.inia.soportedesk.herramientas.monitoreo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "monitores_ping")
@Getter
@Setter
@NoArgsConstructor
public class MonitorPing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String nombre;

    @Column(nullable = false, length = 255)
    private String host;

    @Column(name = "intervalo_segundos", nullable = false)
    private Integer intervaloSegundos;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MonitorPingEstado estado = MonitorPingEstado.ACTIVO;

    @Column(name = "creado_por", nullable = false, length = 80)
    private String creadoPor;

    @Column(name = "ultima_medicion")
    private Instant ultimaMedicion;

    @Column(name = "proxima_medicion")
    private Instant proximaMedicion;

    @Column(name = "ultima_disponible")
    private Boolean ultimaDisponible;

    @Column(name = "ultima_latencia_ms")
    private Double ultimaLatenciaMs;

    @Column(name = "total_muestras", nullable = false)
    private Long totalMuestras = 0L;

    @Column(name = "total_fallidas", nullable = false)
    private Long totalFallidas = 0L;

    @Version
    @Column(nullable = false)
    private Long version = 0L;
}
