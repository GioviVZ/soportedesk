package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.TipoImpresora;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "impresoras")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Impresora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private String modelo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_impresora_id")
    private TipoImpresora tipoImpresora;

    private String serie;

    @Column(name = "codigo_inventario")
    private String codigoInventario;

    @Column(name = "codigo_patrimonial")
    private String codigoPatrimonial;

    @Column(name = "tipo_conexion", nullable = false)
    private String tipoConexion;

    private String ip;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sede_id")
    private Sede sede;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dependencia_id")
    private Dependencia dependencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subdependencia_id")
    private Subdependencia subdependencia;

    @Column(nullable = false)
    private String estado;

    @Column(name = "modelo_toner_negro")
    private String modeloTonerNegro;

    @Column(name = "modelo_toner_c")
    private String modeloTonerC;

    @Column(name = "modelo_toner_m")
    private String modeloTonerM;

    @Column(name = "modelo_toner_y")
    private String modeloTonerY;

    @Column(name = "driver_nombre")
    private String driverNombre;

    @Column(name = "driver_version")
    private String driverVersion;

    @Column(name = "driver_so")
    private String driverSo;

    @Column(name = "driver_archivo_path")
    private String driverArchivoPath;
}
