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
        request.setIpAsignada("10.8.0.2");
        request.setVence(LocalDate.of(2025, 12, 31));
        request.setEstado("Activo");
        return request;
    }

    private Vpn sampleVpn() {
        Vpn vpn = new Vpn();
        vpn.setId(1L);
        vpn.setIpAsignada("10.8.0.2");
        vpn.setEstado("Activo");
        return vpn;
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_vpn"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleVpn()));

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].estado", is("Activo")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
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
        // service is a @MockBean, so the real VpnService.maskCredencialesIfNeeded
        // (covered by VpnServiceTest) never runs here; simulate its effect so this
        // test can verify the controller actually wires the call through.
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
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_vpn", "READ_credenciales-vpn"})
    void findAll_withCredencialesAuthority_keepsCredentials() throws Exception {
        Vpn vpn = sampleVpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        when(service.findAll(null)).thenReturn(List.of(vpn));

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuarioVpn", is("vpnuser1")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any(), any())).thenReturn(sampleVpn());

        mockMvc.perform(post("/api/vpn")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado", is("Activo")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/vpn")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
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
}
