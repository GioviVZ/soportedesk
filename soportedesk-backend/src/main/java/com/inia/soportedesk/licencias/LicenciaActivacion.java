package com.inia.soportedesk.licencias;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "licencia_activaciones")
@Getter
@Setter
@NoArgsConstructor
public class LicenciaActivacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "licencia_id", nullable = false)
    private Licencia licencia;

    @Column(name = "cuenta_activacion", nullable = false, length = 200)
    private String cuentaActivacion;

    @Convert(converter = LicenciaCredentialConverter.class)
    @Column(name = "clave_activacion", nullable = false, length = 1000)
    private String claveActivacion;
}
