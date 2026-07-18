package com.inia.soportedesk.impresoras.intervencion;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ImpresoraIntervencionAdjuntoDto {
    private Long id;
    private String nombreOriginal;
    private String mimeType;
    private String subidoPor;
    private LocalDateTime fechaSubida;
}
