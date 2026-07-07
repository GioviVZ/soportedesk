package com.inia.soportedesk.vpn;

import com.inia.soportedesk.equipos.Equipo;
import com.inia.soportedesk.usuariosred.UsuarioRed;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vpn")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vpn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_red_id")
    private UsuarioRed usuarioRed;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipo_id")
    private Equipo equipo;

    @Column(name = "ip_asignada")
    private String ipAsignada;

    private LocalDate vence;

    @Column(nullable = false)
    private String estado;

    @Column(name = "tiene_antivirus")
    private Boolean tieneAntivirus;

    @Column(name = "vencimiento_antivirus")
    private LocalDate vencimientoAntivirus;

    @Column(name = "usuario_vpn")
    private String usuarioVpn;

    @Column(name = "credencial_vpn")
    private String credencialVpn;

    @Column(name = "estado_solicitud", nullable = false)
    private String estadoSolicitud = "PENDIENTE";

    @Column(name = "tipo_equipo")
    private String tipoEquipo;

    @Column(name = "glpi_computer_id")
    private Long glpiComputerId;

    @Column(name = "glpi_nombre_equipo")
    private String glpiNombreEquipo;

    @Column(name = "glpi_ip_equipo")
    private String glpiIpEquipo;

    @Column(name = "antivirus_verificado")
    private Boolean antivirusVerificado;

    @Column(name = "analisis_antivirus_realizado")
    private Boolean analisisAntivirusRealizado;

    @Column(name = "host_actualizado")
    private Boolean hostActualizado;

    @Column(name = "comentario_responsable", length = 500)
    private String comentarioResponsable;

    @Column(name = "solicitado_por", nullable = false)
    private String solicitadoPor;

    @Column(name = "solicitado_por_nombre")
    private String solicitadoPorNombre;

    @Column(name = "fecha_solicitud", nullable = false)
    private LocalDateTime fechaSolicitud;

    @Column(name = "aprobado_por")
    private String aprobadoPor;

    @Column(name = "aprobado_por_nombre")
    private String aprobadoPorNombre;

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;
}
