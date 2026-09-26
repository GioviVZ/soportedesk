package com.inia.soportedesk.usuariosred.contrato;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class UsuarioRedContratoDto {

    private Long id;
    private String usuario;
    private Long tipoContratoId;
    private String tipoContratoNombre;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String numeroContrato;
    private String personalNombre;
    private String personalApellidos;
    private String registradoPor;
    private LocalDateTime fechaRegistro;
    private String actualizadoPor;
    private LocalDateTime fechaActualizacion;
}
