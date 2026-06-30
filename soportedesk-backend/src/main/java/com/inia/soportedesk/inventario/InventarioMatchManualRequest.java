package com.inia.soportedesk.inventario;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InventarioMatchManualRequest {
    private Long equipoId;
    private Long usuarioRedId;
    private Long vpnId;
    private Boolean confirmar;
    private Boolean ignorar;

    @Size(max = 500, message = "Las notas no pueden superar 500 caracteres")
    private String notas;
}
