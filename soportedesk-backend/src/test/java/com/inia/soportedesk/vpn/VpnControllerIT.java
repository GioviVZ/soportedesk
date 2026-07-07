package com.inia.soportedesk.vpn;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class VpnControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VpnService service;

    private VpnRequest sampleRequest() {
        VpnRequest request = new VpnRequest();
        request.setUsuarioRedId(1L);
        request.setTipoEquipo("PERSONAL");
        request.setAntivirusVerificado(true);
        request.setAnalisisAntivirusRealizado(true);
        return request;
    }

    private Vpn sampleVpn() {
        Vpn vpn = new Vpn();
        vpn.setId(1L);
        vpn.setEstadoSolicitud("PENDIENTE");
        return vpn;
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_vpn"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleVpn()));

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].estadoSolicitud", is("PENDIENTE")));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_solicitar-vpn"})
    void findAll_withReadSolicitarAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleVpn()));

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutAnyReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_vpn"})
    void findAll_withoutCredencialesAuthority_masksCredentials() throws Exception {
        Vpn vpn = sampleVpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        when(service.findAll(null)).thenReturn(List.of(vpn));
        doAnswer(invocation -> {
            List<Vpn> vpns = invocation.getArgument(0);
            vpns.forEach(v -> {
                v.setUsuarioVpn(null);
                v.setCredencialVpn(null);
            });
            return null;
        }).when(service).maskCredencialesIfNeeded(anyList(), any());

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuarioVpn", org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$[0].credencialVpn", org.hamcrest.Matchers.nullValue()));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_solicitar-vpn"})
    void create_withSolicitarAuthority_returnsCreated() throws Exception {
        when(service.crearSolicitud(any(), any())).thenReturn(sampleVpn());

        mockMvc.perform(post("/api/vpn")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estadoSolicitud", is("PENDIENTE")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withoutSolicitarAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/vpn")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_solicitar-vpn"})
    void update_withSolicitarAuthority_returnsOk() throws Exception {
        Vpn updated = sampleVpn();
        when(service.actualizarSolicitud(any(), any(), any())).thenReturn(updated);

        mockMvc.perform(put("/api/vpn/1")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_aprobar-vpn"})
    void aprobar_withAprobarAuthority_returnsOk() throws Exception {
        Vpn approved = sampleVpn();
        approved.setEstadoSolicitud("APROBADO");
        when(service.aprobar(any(), any(), any())).thenReturn(approved);

        VpnAprobarRequest request = new VpnAprobarRequest();
        request.setUsuarioVpn("vpnuser1");
        request.setCredencialVpn("Sup3rSecreta!");
        request.setIpAsignada("10.8.0.5");
        request.setEstado("Activo");

        mockMvc.perform(patch("/api/vpn/1/aprobar")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoSolicitud", is("APROBADO")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void aprobar_withoutAprobarAuthority_returnsForbidden() throws Exception {
        VpnAprobarRequest request = new VpnAprobarRequest();
        request.setUsuarioVpn("vpnuser1");
        request.setCredencialVpn("Sup3rSecreta!");
        request.setIpAsignada("10.8.0.5");
        request.setEstado("Activo");

        mockMvc.perform(patch("/api/vpn/1/aprobar")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_aprobar-vpn"})
    void rechazar_withAprobarAuthority_returnsOk() throws Exception {
        Vpn rejected = sampleVpn();
        rejected.setEstadoSolicitud("RECHAZADO");
        when(service.rechazar(any(), any(), any())).thenReturn(rejected);

        VpnResolucionRequest request = new VpnResolucionRequest();
        request.setComentarioResponsable("Antivirus no verificado");

        mockMvc.perform(patch("/api/vpn/1/rechazar")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoSolicitud", is("RECHAZADO")));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_aprobar-vpn"})
    void observar_withAprobarAuthority_returnsOk() throws Exception {
        Vpn observed = sampleVpn();
        observed.setEstadoSolicitud("OBSERVADO");
        when(service.observar(any(), any(), any())).thenReturn(observed);

        VpnResolucionRequest request = new VpnResolucionRequest();
        request.setComentarioResponsable("Falta equipo GLPI");

        mockMvc.perform(patch("/api/vpn/1/observar")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoSolicitud", is("OBSERVADO")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void patchAntivirus_withSoporteRole_returnsOk() throws Exception {
        VpnAntivirusRequest req = new VpnAntivirusRequest();
        req.setTieneAntivirus(true);
        req.setVencimientoAntivirus(LocalDate.of(2026, 12, 31));

        Vpn vpn = sampleVpn();
        vpn.setTieneAntivirus(true);
        when(service.updateAntivirus(any(), any())).thenReturn(vpn);

        mockMvc.perform(patch("/api/vpn/1/antivirus")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tieneAntivirus", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_withAdminRole_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/vpn/1"))
                .andExpect(status().isNoContent());
    }
}
