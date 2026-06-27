package com.inia.soportedesk.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private String nombre;
    private String rol;
    private Map<String, String> permisos;
}
