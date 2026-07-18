package com.inia.soportedesk.impresoras.intervencion;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class ImpresoraIntervencionDto {
    private Long id;
    private LocalDate fecha;
    private String observacion;
    private String registradoPor;
    private LocalDateTime fechaRegistro;
    private List<ImpresoraIntervencionAdjuntoDto> adjuntos;
}
