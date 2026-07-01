package com.inia.soportedesk.gestiontiinia;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Immutable
@Table(name = "vw_GW_Dashboard", catalog = "GestionTI_INIA", schema = "dbo")
@Getter
@NoArgsConstructor
public class VwGwDashboard {

    @Id
    @Column(name = "Email")
    private String email;

    @Formula("[LicenciasTotales]")
    private int licenciasTotales;

    @Formula("[LicenciasAsignadas]")
    private Integer licenciasAsignadas;

    @Formula("[LicenciasDisponibles]")
    private Integer licenciasDisponibles;

    @Column(name = "Unidad")
    private String unidad;

    @Column(name = "SedeID")
    private int sedeId;

    @Column(name = "Sede")
    private String sede;

    @Formula("[OficinaPadre]")
    private String oficinaPadre;

    @Column(name = "Oficina")
    private String oficina;

    @Column(name = "Estado")
    private String estado;

    @Column(name = "Modalidad")
    private String modalidad;

    @Column(name = "EmployeeID")
    private String employeeId;

    @Column(name = "OUID")
    private int ouid;

    @Formula("[OrgUnitPath]")
    private String orgUnitPath;

    @Formula("[NombreCompleto]")
    private String nombreCompleto;

    @Column(name = "Verificacion2Pasos")
    private String verificacion2Pasos;

    @Formula("[UltimoInicioSesion]")
    private LocalDateTime ultimoInicioSesion;

    @Formula("[EmailUsageMB]")
    private BigDecimal emailUsageMB;

    @Formula("[DriveUsageMB]")
    private BigDecimal driveUsageMB;

    @Formula("[PhotosUsageMB]")
    private BigDecimal photosUsageMB;

    @Formula("[StorageUsedMB]")
    private BigDecimal storageUsedMB;

    @Formula("[TotalUsoMB]")
    private BigDecimal totalUsoMB;

    @Column(name = "Categoria")
    private String categoria;

    @Formula("[TotalUsuariosCategoria]")
    private Integer totalUsuariosCategoria;
}
