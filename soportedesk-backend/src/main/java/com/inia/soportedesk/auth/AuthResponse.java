package com.inia.soportedesk.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private String nombre;
    private String rol;
    private List<String> permisos;
}
