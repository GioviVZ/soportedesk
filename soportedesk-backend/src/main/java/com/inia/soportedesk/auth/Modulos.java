package com.inia.soportedesk.auth;

import java.util.Set;

public final class Modulos {

    public static final Set<String> SOLO_VISTA = Set.of(
            "auditoria", "herramientas");

    public static final Set<String> VALIDOS = Set.of(
            "usuarios-red", "correos", "equipos", "vpn", "credenciales-vpn",
            "solicitar-vpn", "aprobar-vpn",
            "impresoras", "wifi", "licencias", "catalogos",
            "auditoria", "herramientas");

    private Modulos() {
    }
}
