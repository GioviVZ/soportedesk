package com.inia.soportedesk.equipos.evidencia;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class EquipoEvidenciaDto {
    private Long id;
    private String nombreOriginal;
    private String descripcion;
    private String subidoPor;
    private LocalDateTime fechaSubida;
}
