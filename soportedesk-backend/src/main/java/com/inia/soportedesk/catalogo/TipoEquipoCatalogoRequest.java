package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TipoEquipoCatalogoRequest {
    @NotBlank private String glpiValor;
    @NotBlank private String tipoNormalizado;
}
