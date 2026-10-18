package com.inia.soportedesk.activedirectory;

import org.junit.jupiter.api.Test;

import javax.naming.CommunicationException;
import javax.naming.ContextNotEmptyException;
import javax.naming.NoPermissionException;

import static org.assertj.core.api.Assertions.assertThat;

class ActiveDirectoryErrorMessageTest {

    @Test
    void permisoDenegadoEnCuentaProtegidaExplicaAdminCount() {
        String mensaje = ActiveDirectoryService.mensajeErrorAd(
                new NoPermissionException(), "flopez", true, "Mensaje generico");

        assertThat(mensaje).contains("adminCount=1", "flopez");
    }

    @Test
    void permisoDenegadoEnvueltoExplicaLaDelegacion() {
        String mensaje = ActiveDirectoryService.mensajeErrorAd(
                new RuntimeException(new NoPermissionException()), "flopez", false, "Mensaje generico");

        assertThat(mensaje).contains("denegó el permiso");
    }

    @Test
    void errorDeComunicacionExplicaLaConexion() {
        String mensaje = ActiveDirectoryService.mensajeErrorAd(
                new CommunicationException(), "flopez", false, "Mensaje generico");

        assertThat(mensaje).contains("No se pudo conectar");
    }

    @Test
    void cuentaConDependenciasExplicaPorQueNoSePuedeEliminar() {
        String mensaje = ActiveDirectoryService.mensajeErrorAd(
                new ContextNotEmptyException(), "flopez", false, "Mensaje generico");

        assertThat(mensaje).contains("objetos dependientes");
    }

    @Test
    void errorNoClasificadoDevuelveElMensajeGenericoSinCambios() {
        String mensajeGenerico = "Mensaje generico sin cambios";

        String mensaje = ActiveDirectoryService.mensajeErrorAd(
                new Exception("Otro error"), "flopez", false, mensajeGenerico);

        assertThat(mensaje).isEqualTo(mensajeGenerico);
    }
}
