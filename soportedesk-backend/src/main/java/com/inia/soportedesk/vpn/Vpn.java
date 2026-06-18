package com.inia.soportedesk.vpn;

import com.inia.soportedesk.equipos.Equipo;
import com.inia.soportedesk.usuariosred.UsuarioRed;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

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
}
