package com.inia.soportedesk.vpn;

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

    // La columna equipo_id y su FK hacia dbo.equipos existian pero
    // dbo.equipos siempre tuvo 0 filas (verificado en la auditoria
    // original) -- se retiro la tabla en la Fase 0 del plan de
    // normalizacion (24-jul-2026). Este campo nunca resolvia una fila
    // real; se elimina porque con la tabla ya retirada, el JOIN EAGER
    // rompia CADA consulta VPN ("Invalid object name 'equipos'").

    @Transient
    private LocalDate vence;

    @Transient
    private LocalDate vencimientoBaseVpn;

    @Transient
    private LocalDate vencimientoContrato;

    @Transient
    private String venceOrigen;

    @Transient
    private boolean terceroOrdenServicio;

    @Transient
    private String terceroNombre;

    @Transient
    private String numeroOrdenServicio;

    @Transient
    private LocalDate vencimientoOrdenServicio;

    @Transient
    private String ultimoContratoTipo;

    @Transient
    private String ultimoContratoNumero;

    @Transient
    private LocalDate ultimoContratoFechaFin;

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

    @Column(name = "numero_ticket")
    private String numeroTicket;

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

    @Column(name = "sistema_operativo_actualizado")
    private Boolean sistemaOperativoActualizado;

    @Column(name = "forticlient_instalado")
    private Boolean forticlientInstalado;

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

    @Column(name = "titular_tipo", nullable = false)
    private String titularTipo = "AD";

    @Column(name = "titular_nombre")
    private String titularNombre;

    @Column(name = "titular_apellidos")
    private String titularApellidos;

    @Column(name = "titular_correo")
    private String titularCorreo;

    @Column(name = "titular_empresa")
    private String titularEmpresa;

    @Column(name = "titular_motivo", length = 500)
    private String titularMotivo;

    @Column(name = "titular_cargo", nullable = false)
    private String titularCargo;

    @Column(name = "ad_sam_account_name")
    private String adSamAccountName;

    @Column(name = "ad_display_name")
    private String adDisplayName;

    @Column(name = "ad_mail")
    private String adMail;

    @Column(name = "ad_office")
    private String adOffice;

    @Column(name = "ad_organizational_unit")
    private String adOrganizationalUnit;

    @Transient
    public String getTitularNombreCompleto() {
        if ("AD".equals(titularTipo)) {
            if (adDisplayName != null && !adDisplayName.isBlank()) return adDisplayName;
            if (adSamAccountName != null && !adSamAccountName.isBlank()) return adSamAccountName;
        }
        String apellidos = titularApellidos == null ? "" : " " + titularApellidos;
        return (titularNombre == null ? "" : titularNombre) + apellidos;
    }

    @Transient
    public String getTitularOrigenLabel() {
        if (terceroOrdenServicio) return "Tercero / OS";
        return "EXTERNO".equals(titularTipo) ? "Externo" : "AD";
    }
}
