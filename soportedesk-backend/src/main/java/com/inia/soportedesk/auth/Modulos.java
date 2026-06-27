package com.inia.soportedesk.auth;

import java.util.Set;

public final class Modulos {

    public static final Set<String> SOLO_VISTA = Set.of(
            "auditoria", "herramientas", "inventario-equipos");

    public static final Set<String> VALIDOS = Set.of(
            "usuarios-red", "correos", "equipos", "vpn", "credenciales-vpn",
            "impresoras", "wifi", "licencias",
            "auditoria", "herramientas", "inventario-equipos");

    private Modulos() {
    }
}
