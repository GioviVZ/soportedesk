package com.inia.soportedesk.impresoras;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "impresoras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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

    private String ip;

    private String piso;

    private String area;

    @Column(nullable = false)
    private String estado;

    @Column(name = "toner_negro")
    private Integer tonerNegro;

    @Column(name = "toner_c")
    private Integer tonerC;

    @Column(name = "toner_m")
    private Integer tonerM;

    @Column(name = "toner_y")
    private Integer tonerY;

    private Integer cartucho;

    private Integer drum;

    private Integer fusor;

    @Column(name = "driver_nombre")
    private String driverNombre;

    @Column(name = "driver_version")
    private String driverVersion;

    @Column(name = "driver_so")
    private String driverSo;

    @Column(name = "driver_archivo_path")
    private String driverArchivoPath;
}
