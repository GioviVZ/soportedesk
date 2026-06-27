package com.inia.soportedesk.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class UsuarioSistemaRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String nombre;

    private String password;

    private boolean activo = true;

    private Map<String, String> permisos;
}
