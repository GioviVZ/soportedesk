package com.inia.soportedesk.auditoria;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inia.soportedesk.realtime.RealtimeEventService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuditoriaFilterTest {

    @Mock
    private MovimientoAuditoriaService auditoriaService;

    @Mock
    private RealtimeEventService realtimeEventService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void patch_registraAccionDetalleYProtegeDatosSensibles() throws Exception {
        AuditoriaFilter filter = new AuditoriaFilter(auditoriaService, realtimeEventService, new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("PATCH", "/api/vpn/42/aprobar");
        request.setContentType(MediaType.APPLICATION_JSON_VALUE);
        request.setContent(("{\"comentario\":\"Cumple la revisión\","
                + "\"credencialVpn\":\"vpn-secreta\",\"passwordNueva\":\"clave-secreta\"}")
                .getBytes(StandardCharsets.UTF_8));
        request.setRemoteAddr("10.0.0.8");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (servletRequest, servletResponse) -> servletRequest.getInputStream().readAllBytes();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("maria", "", List.of()));

        filter.doFilter(request, response, chain);

        ArgumentCaptor<String> detail = ArgumentCaptor.forClass(String.class);
        verify(auditoriaService).registrar(
                eq("maria"), eq("APROBAR"), eq("vpn"), eq("PATCH"), eq("/api/vpn/42/aprobar"),
                eq("42"), eq(200), eq("10.0.0.8"), detail.capture());
        assertThat(detail.getValue())
                .contains("Aprobó una solicitud de VPN (ID 42)")
                .contains("Cumple la revisión")
                .contains("[PROTEGIDO]")
                .doesNotContain("vpn-secreta", "clave-secreta");
        verify(realtimeEventService).publish("vpn", "APROBAR", "42", "maria");
    }

    @Test
    void activeDirectory_noDuplicaLaAuditoriaEspecializada() throws Exception {
        AuditoriaFilter filter = new AuditoriaFilter(auditoriaService, realtimeEventService, new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest(
                "POST", "/api/active-directory/usuarios/jperez/desbloquear");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (servletRequest, servletResponse) -> { });

        verify(auditoriaService, never()).registrar(
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any());
    }
}
