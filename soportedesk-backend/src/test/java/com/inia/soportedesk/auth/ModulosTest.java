package com.inia.soportedesk.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ModulosTest {

    @Test
    void validos_containsAllModuleKeys() {
        assertThat(Modulos.VALIDOS).containsExactlyInAnyOrder(
                "usuarios-red", "correos", "equipos", "vpn", "credenciales-vpn",
                "solicitar-vpn", "aprobar-vpn",
                "impresoras", "wifi", "licencias", "catalogos",
                "auditoria", "herramientas");
    }

    @Test
    void soloVista_isSubsetOfValidos() {
        assertThat(Modulos.SOLO_VISTA).containsExactlyInAnyOrder(
                "correos", "vpn", "auditoria");
        assertThat(Modulos.VALIDOS).containsAll(Modulos.SOLO_VISTA);
        assertThat(Modulos.SOLO_VISTA).doesNotContain("herramientas");
    }
}
