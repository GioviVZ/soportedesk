package com.inia.soportedesk.usuariosred;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.TipoContrato;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios_red")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String usuario;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String apellidos;

    @Column(nullable = false)
    private String grupo;

    @Column(name = "unidad_organizativa")
    private String unidadOrganizativa;

    @Column(name = "ultimo_login")
    private LocalDateTime ultimoLogin;

    @Column(nullable = false)
    private String estado;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sede_id", nullable = false)
    private Sede sede;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dependencia_id", nullable = false)
    private Dependencia dependencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subdependencia_id", nullable = false)
    private Subdependencia subdependencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_contrato_id", nullable = false)
    private TipoContrato tipoContrato;

    @Column(name = "fecha_fin_contrato")
    private LocalDate fechaFinContrato;

    @Column(name = "fecha_creacion")
    private LocalDate fechaCreacion;

    @Column(name = "numero_contrato", length = 100)
    private String numeroContrato;
}
