package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.ModeloImpresora;
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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "modelo_impresora_id", nullable = false)
    private ModeloImpresora modeloImpresora;

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

    @Column(name = "driver_nombre")
    private String driverNombre;

    @Column(name = "driver_version")
    private String driverVersion;

    @Column(name = "driver_so")
    private String driverSo;

    @Column(name = "driver_archivo_path")
    private String driverArchivoPath;
}
