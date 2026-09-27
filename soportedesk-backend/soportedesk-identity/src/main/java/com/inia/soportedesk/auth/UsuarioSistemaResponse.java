package com.inia.soportedesk.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class UsuarioSistemaResponse {
    private Long id;
    private String username;
    private String nombre;
    private String rol;
    private boolean activo;
    private Map<String, String> permisos;
}
