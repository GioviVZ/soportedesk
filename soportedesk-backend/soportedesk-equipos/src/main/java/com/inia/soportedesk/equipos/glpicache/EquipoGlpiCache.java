package com.inia.soportedesk.equipos.glpicache;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipo_glpi_cache")
@Getter
@Setter
public class EquipoGlpiCache {

    @Id
    @Column(name = "computer_id")
    @JsonProperty("computerID")
    private Long computerId;

    @Column(name = "nombre_equipo")
    private String nombreEquipo;

    @Column(name = "numero_serie")
    private String numeroserie;

    @Column(name = "codigo_interno")
    private String codigoInterno;

    @Column(name = "usuario_contacto")
    private String usuarioContacto;

    @Column(name = "usuario_telefono")
    private String usuarioTelefono;

    @Column(name = "ip_equipo")
    private String ipEquipo;

    @Column(name = "sede_nombre")
    private String sedeNombre;

    @Column(name = "sede_nombre_completo")
    private String sedeNombreCompleto;

    @Column(name = "oficina_id")
    private String oficinaId;

    @Column(name = "unidad_id")
    private String unidadId;

    @Column(name = "fabricante_equipo")
    private String fabricanteEquipo;

    @Column(name = "modelo_equipo")
    private String modeloEquipo;

    @Column(name = "tipo_equipo")
    private String tipoEquipo;

    @Column(name = "cpu_modelos")
    private String cpuModelos;

    @Column(name = "cpu_fabricantes")
    private String cpuFabricantes;

    @Column(name = "cpu_conteo")
    private Long cpuConteo;

    @Column(name = "cpu_nucleos")
    private BigDecimal cpuNucleos;

    @Column(name = "cpu_hilos")
    private BigDecimal cpuHilos;

    @Column(name = "cpu_frecuencia_max")
    private Long cpuFrecuenciaMax;

    @Column(name = "ram_modulos")
    private Long ramModulos;

    @Column(name = "ram_total_gb")
    private BigDecimal ramTotalGb;

    @Column(name = "ram_frecuencia_max")
    private String ramFrecuenciaMax;

    @Column(name = "ram_tipos")
    private String ramTipos;

    @Column(name = "ram_modelos")
    private String ramModelos;

    @Column(name = "ram_fabricantes")
    private String ramFabricantes;

    @Column(name = "disk_cantidad")
    private Long diskCantidad;

    @Column(name = "disk_total_gb")
    private BigDecimal diskTotalGb;

    @Column(name = "disk_tipos")
    private String diskTipos;

    @Column(name = "disk_interfaces")
    private String diskInterfaces;

    @Column(name = "disk_modelos")
    private String diskModelos;

    @Column(name = "mon_cantidad")
    private Long monCantidad;

    @Column(name = "mon_nombres")
    private String monNombres;

    @Column(name = "mon_modelos")
    private String monModelos;

    @Column(name = "mon_fabricantes")
    private String monFabricantes;

    @Column(name = "mon_seriales")
    private String monSeriales;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "ultima_actualizacion")
    private LocalDateTime ultimaActualizacion;

    @Column(name = "ultimo_encendido")
    private LocalDateTime ultimoEncendido;

    @Column(name = "eliminado")
    private Integer eliminado;

    @Column(name = "uuid_equipo")
    private String uuidEquipo;

    @Column(name = "anydesk_id")
    private String anydeskId;

    @Column(name = "rustdesk_id")
    private String rustdeskId;

    @Column(name = "teclado_marca")
    private String tecladoMarca;

    @Column(name = "teclado_modelo")
    private String tecladoModelo;

    @Column(name = "teclado_numero_serie")
    private String tecladoNumeroSerie;

    @Column(name = "teclado_codigo_inventario")
    private String tecladoCodigoInventario;

    @Column(name = "teclado_codigo_patrimonial")
    private String tecladoCodigoPatrimonial;

    @Column(name = "monitor1_nombre")
    private String monitor1Nombre;

    @Column(name = "monitor1_marca")
    private String monitor1Marca;

    @Column(name = "monitor1_modelo")
    private String monitor1Modelo;

    @Column(name = "monitor1_serie")
    private String monitor1Serie;

    @Column(name = "monitor2_nombre")
    private String monitor2Nombre;

    @Column(name = "monitor2_marca")
    private String monitor2Marca;

    @Column(name = "monitor2_modelo")
    private String monitor2Modelo;

    @Column(name = "monitor2_serie")
    private String monitor2Serie;

    @Column(name = "synced_at", nullable = false)
    private LocalDateTime syncedAt;

    @Transient
    private String codigoPatrimonial;

    @Transient
    private String monitorFabricanteOverride;

    @Transient
    private String monitorModeloOverride;

    @Transient
    private String monitorNumeroSerieOverride;

    @Transient
    private String monitorCodigoPatrimonial;

    @Transient
    private String monitorCodigoInternoOverride;

    @Transient
    private String monitor2FabricanteOverride;

    @Transient
    private String monitor2ModeloOverride;

    @Transient
    private String monitor2NumeroSerieOverride;

    @Transient
    private String monitor2CodigoPatrimonial;

    @Transient
    private String monitor2CodigoInternoOverride;
}
