package com.inia.soportedesk.identidad;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "persona_candidato")
@Getter
@Setter
@NoArgsConstructor
public class PersonaCandidato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "persona_candidato_id")
    private Long id;

    @Column(name = "sam_account_name", nullable = false)
    private String samAccountName;

    @Column(nullable = false)
    private String nombres;

    @Column(nullable = false)
    private String apellidos;

    @Column(name = "correo_institucional")
    private String correoInstitucional;

    // PERSONAL / FUNCIONAL / SERVICIO / null = sin senal suficiente
    @Column(name = "clasificacion_sugerida")
    private String clasificacionSugerida;

    // PENDIENTE / CONFIRMADO / DESCARTADO
    @Column(nullable = false)
    private String estado = "PENDIENTE";

    @Column(name = "fecha_deteccion", nullable = false)
    private LocalDateTime fechaDeteccion;

    @Column(name = "confirmado_por")
    private String confirmadoPor;

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;

    @Column(name = "persona_id")
    private Long personaId;
}
