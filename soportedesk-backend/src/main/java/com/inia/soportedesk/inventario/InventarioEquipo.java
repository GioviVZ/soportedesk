package com.inia.soportedesk.inventario;

import com.inia.soportedesk.equipos.Equipo;
import com.inia.soportedesk.usuariosred.UsuarioRed;
import com.inia.soportedesk.vpn.Vpn;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inventario_equipos")
@Getter
@Setter
public class InventarioEquipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "agent_id", length = 80)
    private String agentId;

    @Column(name = "hostname", length = 120, nullable = false)
    private String hostname;

    @Column(name = "serial_equipo", length = 120)
    private String serialEquipo;

    @Column(name = "fabricante", length = 160)
    private String fabricante;

    @Column(name = "modelo", length = 180)
    private String modelo;

    @Column(name = "dominio", length = 180)
    private String dominio;

    @Column(name = "ou", length = 500)
    private String ou;

    @Column(name = "usuario_actual", length = 180)
    private String usuarioActual;

    @Column(name = "sistema_operativo", length = 220)
    private String sistemaOperativo;

    @Column(name = "version_sistema", length = 100)
    private String versionSistema;

    @Column(name = "arquitectura", length = 80)
    private String arquitectura;

    @Column(name = "procesador", length = 260)
    private String procesador;

    @Column(name = "ram_total_bytes")
    private Long ramTotalBytes;

    @Column(name = "ip_principal", length = 80)
    private String ipPrincipal;

    @Column(name = "mac_principal", length = 80)
    private String macPrincipal;

    @Column(name = "ultimo_reporte")
    private LocalDateTime ultimoReporte;

    @Column(name = "ip_reporte", length = 80)
    private String ipReporte;

    @Column(name = "estado_agente", length = 40, nullable = false)
    private String estadoAgente = "ACTUALIZADO";

    @Column(name = "origen", length = 40, nullable = false)
    private String origen = "AGENTE_AD";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipo_relacionado_id")
    private Equipo equipoRelacionado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_red_relacionado_id")
    private UsuarioRed usuarioRedRelacionado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vpn_relacionado_id")
    private Vpn vpnRelacionado;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_estado", length = 40, nullable = false)
    private InventarioMatchEstado matchEstado = InventarioMatchEstado.SIN_MATCH;

    @Column(name = "match_score")
    private Integer matchScore = 0;

    @Column(name = "match_notas", length = 500)
    private String matchNotas;

    @Column(name = "match_fecha")
    private LocalDateTime matchFecha;

    @OneToMany(mappedBy = "equipo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("nombre ASC")
    private List<InventarioPrograma> programas = new ArrayList<>();

    @OneToMany(mappedBy = "equipo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("letra ASC")
    private List<InventarioDisco> discos = new ArrayList<>();

    @OneToMany(mappedBy = "equipo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("descripcion ASC")
    private List<InventarioRed> redes = new ArrayList<>();
}
