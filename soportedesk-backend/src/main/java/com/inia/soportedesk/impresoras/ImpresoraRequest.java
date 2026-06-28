package com.inia.soportedesk.impresoras;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImpresoraRequest {

    @NotNull
    private Long modeloImpresoraId;

    private Long tipoImpresoraId;

    private String serie;

    private String codigoInventario;

    private String codigoPatrimonial;

    @NotBlank
    private String tipoConexion;

    private String ip;
    private Long sedeId;
    private Long dependenciaId;
    private Long subdependenciaId;

    @NotBlank
    private String estado;
}
