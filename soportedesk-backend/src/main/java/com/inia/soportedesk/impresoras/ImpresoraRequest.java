package com.inia.soportedesk.impresoras;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImpresoraRequest {

    @NotNull
    private Long modeloImpresoraId;

    private Long tipoImpresoraId;

    @Size(max = 255)
    private String serie;

    @Size(max = 255)
    private String codigoInventario;

    @Size(max = 255)
    private String codigoPatrimonial;

    @Size(max = 255)
    private String referencia;

    @NotBlank
    @Pattern(regexp = "(?i)USB|IP", message = "El tipo de conexion debe ser USB o IP")
    private String tipoConexion;

    @Size(max = 45)
    private String ip;
    private Long sedeId;
    private Long dependenciaId;
    private Long subdependenciaId;

    @NotBlank
    @Size(max = 100)
    @Pattern(regexp = "Activa|En mantenimiento|De baja", message = "El estado de la impresora no es valido")
    private String estado;
}
