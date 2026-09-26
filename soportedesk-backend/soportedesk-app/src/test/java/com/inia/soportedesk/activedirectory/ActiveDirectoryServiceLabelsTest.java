package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.config.LdapContextFactory;
import com.inia.soportedesk.activedirectory.dto.UpdateUserInfoRequest;
import com.inia.soportedesk.auditoria.AdAuditoriaService;
import com.inia.soportedesk.auditoria.MovimientoAuditoriaService;
import com.inia.soportedesk.usuariosred.contrato.UsuarioRedContratoRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import javax.naming.directory.BasicAttribute;
import javax.naming.directory.BasicAttributes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class ActiveDirectoryServiceLabelsTest {

    private final ActiveDirectoryService service = new ActiveDirectoryService(
            mock(LdapContextFactory.class),
            mock(MovimientoAuditoriaService.class),
            mock(HttpServletRequest.class),
            mock(AdUsuarioCacheRepository.class),
            mock(AdCacheMetadataRepository.class),
            mock(AdSyncJobStatus.class),
            mock(ApplicationEventPublisher.class),
            mock(UsuarioRedContratoRepository.class),
            mock(AdAuditoriaService.class));

    @Test
    void describirCambiosInfo_soloListaCamposQueRealmenteCambiaron() throws Exception {
        BasicAttributes antes = new BasicAttributes(true);
        antes.put(new BasicAttribute("displayName", "Juan Perez"));
        antes.put(new BasicAttribute("title", "Analista"));
        antes.put(new BasicAttribute("mail", "jperez@inia.gob.pe"));

        UpdateUserInfoRequest body = new UpdateUserInfoRequest(
                "Juan Perez", "Administrador de Red", null, null, null, null, null, false, null);

        String resultado = service.describirCambiosInfo(antes, body);

        assertThat(resultado).isEqualTo("Campos actualizados: Cargo: Analista -> Administrador de Red");
    }

    @Test
    void describirCambiosInfo_sinCambiosDevuelveNull() throws Exception {
        BasicAttributes antes = new BasicAttributes(true);
        antes.put(new BasicAttribute("displayName", "Juan Perez"));

        UpdateUserInfoRequest body = new UpdateUserInfoRequest(
                "Juan Perez", null, null, null, null, null, null, false, null);

        String resultado = service.describirCambiosInfo(antes, body);

        assertThat(resultado).isNull();
    }

    @Test
    void describirCambiosInfo_campoAntesVacioMuestraVacio() throws Exception {
        BasicAttributes antes = new BasicAttributes(true);

        UpdateUserInfoRequest body = new UpdateUserInfoRequest(
                null, null, null, null, null, null, "nuevo@inia.gob.pe", false, null);

        String resultado = service.describirCambiosInfo(antes, body);

        assertThat(resultado).isEqualTo("Campos actualizados: Correo: (vacio) -> nuevo@inia.gob.pe");
    }

    @Test
    void describirCambiosInfo_clearMailConCorreoAnteriorReportaEliminacion() throws Exception {
        BasicAttributes antes = new BasicAttributes(true);
        antes.put(new BasicAttribute("mail", "jperez@inia.gob.pe"));

        UpdateUserInfoRequest body = new UpdateUserInfoRequest(
                null, null, null, null, null, null, null, true, null);

        String resultado = service.describirCambiosInfo(antes, body);

        assertThat(resultado).isEqualTo("Campos actualizados: Correo: jperez@inia.gob.pe -> (eliminado)");
    }
}
