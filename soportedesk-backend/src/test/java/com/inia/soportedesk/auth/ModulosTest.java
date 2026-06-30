package com.inia.soportedesk.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ModulosTest {

    @Test
    void validos_containsAllModuleKeys() {
        assertThat(Modulos.VALIDOS).containsExactlyInAnyOrder(
                "usuarios-red", "correos", "equipos", "vpn", "credenciales-vpn",
                "impresoras", "wifi", "licencias",
                "auditoria", "herramientas", "inventario-equipos");
    }

    @Test
    void soloVista_isSubsetOfValidos() {
        assertThat(Modulos.SOLO_VISTA).containsExactlyInAnyOrder(
                "auditoria", "herramientas", "inventario-equipos");
        assertThat(Modulos.VALIDOS).containsAll(Modulos.SOLO_VISTA);
    }
}
