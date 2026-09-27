package com.inia.soportedesk.usuariosred.contrato;

import com.inia.soportedesk.catalogo.TipoContrato;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios_red_contratos")
@Getter
@Setter
@NoArgsConstructor
public class UsuarioRedContrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String usuario;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_contrato_id", nullable = false)
    private TipoContrato tipoContrato;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column(name = "numero_contrato", length = 100)
    private String numeroContrato;

    @Column(name = "personal_nombre", length = 150)
    private String personalNombre;

    @Column(name = "personal_apellidos", length = 150)
    private String personalApellidos;

    @Column(name = "registrado_por", length = 100)
    private String registradoPor;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;

    @Column(name = "actualizado_por", length = 100)
    private String actualizadoPor;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
}
