package com.inia.soportedesk.auditoria;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdAuditoriaServiceTest {

    @Mock
    private AdAuditoriaRepository repository;

    @Test
    void registrar_calculaDuracionMsYGuardaConValoresFijos() {
        AdAuditoriaService service = new AdAuditoriaService(repository);
        LocalDateTime inicio = LocalDateTime.of(2026, 8, 5, 10, 0, 0);
        LocalDateTime fin = inicio.plusNanos(150_000_000);

        service.registrar(new AdAuditoriaRegistro(
                "admin", null, "dhuaman", "CN=Darwin,OU=INIA", "HABILITAR_CUENTA", "EXITOSO",
                "Cuenta habilitada correctamente.", null, "Deshabilitada", "Habilitada",
                "dhuaman", "/api/active-directory/usuarios/dhuaman/habilitar", "POST",
                "127.0.0.1", "JUnit", UUID.randomUUID(), inicio, fin));

        ArgumentCaptor<AdAuditoria> captor = ArgumentCaptor.forClass(AdAuditoria.class);
        verify(repository).save(captor.capture());
        AdAuditoria guardado = captor.getValue();
        assertThat(guardado.getDuracionMs()).isEqualTo(150);
        assertThat(guardado.getEstadoAnterior()).isEqualTo("Deshabilitada");
        assertThat(guardado.getEstadoNuevo()).isEqualTo("Habilitada");
        assertThat(guardado.getModulo()).isEqualTo("ACTIVE_DIRECTORY");
        assertThat(guardado.getTipoRecurso()).isEqualTo("USUARIO");
        assertThat(guardado.getAplicacion()).isEqualTo("SoporteDesk");
        assertThat(guardado.getOperadorUsuario()).isEqualTo("admin");
    }

    @Test
    void registrar_noPropagaExcepcionSiRepositoryFalla() {
        AdAuditoriaService service = new AdAuditoriaService(repository);
        when(repository.save(any())).thenThrow(new RuntimeException("timeout de BD"));

        service.registrar(new AdAuditoriaRegistro(
                "admin", null, "dhuaman", null, "HABILITAR_CUENTA", "EXITOSO",
                "Cuenta habilitada correctamente.", null, "Deshabilitada", "Habilitada",
                "dhuaman", "/api/active-directory/usuarios/dhuaman/habilitar", "POST",
                "127.0.0.1", null, UUID.randomUUID(), LocalDateTime.now(), LocalDateTime.now()));

        // Si llega aqui sin lanzar excepcion, el test pasa.
    }

    @Test
    void registrar_usuarioNuloSeReemplazaPorSistema() {
        AdAuditoriaService service = new AdAuditoriaService(repository);
        LocalDateTime ahora = LocalDateTime.now();

        service.registrar(new AdAuditoriaRegistro(
                null, null, "dhuaman", null, "HABILITAR_CUENTA", "EXITOSO", "ok", null, null, null,
                "dhuaman", "/api/x", "POST", "127.0.0.1", null, UUID.randomUUID(), ahora, ahora));

        ArgumentCaptor<AdAuditoria> captor = ArgumentCaptor.forClass(AdAuditoria.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getOperadorUsuario()).isEqualTo("sistema");
    }
}
