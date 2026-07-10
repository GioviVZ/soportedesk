package com.inia.soportedesk.glpi;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Immutable
@Table(name = "vw_inv_computers_full")
@Getter
@Setter
@NoArgsConstructor
public class VwInvComputerFull {

    @Id
    @Column(name = "ComputerID")
    private Long computerID;

    @Column(name = "Nombre_Equipo")
    private String nombreEquipo;

    @Column(name = "Numero_Serie")
    private String numeroserie;

    @Column(name = "Codigo_Interno")
    private String codigoInterno;

    @Column(name = "UsuarioContacto")
    private String usuarioContacto;

    @Column(name = "UsuarioTelefono")
    private String usuarioTelefono;

    @Column(name = "IP_Equipo")
    private String ipEquipo;

    @Column(name = "Sede_Nombre")
    private String sedeNombre;

    @Column(name = "Sede_Nombre_Completo")
    private String sedeNombreCompleto;

    @Column(name = "OficinaID")
    private String oficinaId;

    @Column(name = "UnidadID")
    private String unidadId;

    @Column(name = "Fabricante_Equipo")
    private String fabricanteEquipo;

    @Column(name = "Modelo_Equipo")
    private String modeloEquipo;

    @Column(name = "Tipo_Equipo")
    private String tipoEquipo;

    @Column(name = "CPU_Modelos")
    private String cpuModelos;

    @Column(name = "CPU_Fabricantes")
    private String cpuFabricantes;

    @Column(name = "CPU_Conteo")
    private Long cpuConteo;

    @Column(name = "CPU_Nucleos")
    private BigDecimal cpuNucleos;

    @Column(name = "CPU_Hilos")
    private BigDecimal cpuHilos;

    @Column(name = "CPU_Frecuencia_Max")
    private Long cpuFrecuenciaMax;

    @Column(name = "RAM_Modulos")
    private Long ramModulos;

    @Column(name = "RAM_Total_GB")
    private BigDecimal ramTotalGb;

    @Column(name = "RAM_Frecuencia_Max")
    private String ramFrecuenciaMax;

    @Column(name = "RAM_Tipos")
    private String ramTipos;

    @Column(name = "RAM_Modelos")
    private String ramModelos;

    @Column(name = "RAM_Fabricantes")
    private String ramFabricantes;

    @Column(name = "DISK_Cantidad")
    private Long diskCantidad;

    @Column(name = "DISK_Total_GB")
    private BigDecimal diskTotalGb;

    @Column(name = "DISK_Tipos")
    private String diskTipos;

    @Column(name = "DISK_Interfaces")
    private String diskInterfaces;

    @Column(name = "DISK_Modelos")
    private String diskModelos;

    @Column(name = "MON_Cantidad")
    private Long monCantidad;

    @Column(name = "MON_Nombres")
    private String monNombres;

    @Column(name = "MON_Modelos")
    private String monModelos;

    @Column(name = "MON_Fabricantes")
    private String monFabricantes;

    @Column(name = "MON_Seriales")
    private String monSeriales;

    @Column(name = "Fecha_Creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "Ultima_Actualizacion")
    private LocalDateTime ultimaActualizacion;

    @Column(name = "Ultimo_Encendido")
    private LocalDateTime ultimoEncendido;

    @Column(name = "Eliminado")
    private Integer eliminado;

    @Column(name = "UUID_Equipo")
    private String uuidEquipo;
}
