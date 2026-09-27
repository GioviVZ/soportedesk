package com.inia.soportedesk.dashboard;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DashboardControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DashboardService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void getCounts_allowsAuthenticatedUser() throws Exception {
        when(service.getCounts(any(Authentication.class))).thenReturn(
                new DashboardCounts(5, 12, 20, 3, 1, 4, 7, 15, 2, 4, LocalDate.of(2026, 8, 15)));

        mockMvc.perform(get("/api/dashboard/counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.licencias", is(5)))
                .andExpect(jsonPath("$.usuariosRed", is(20)))
                .andExpect(jsonPath("$.usuariosRedPorVencer", is(4)))
                .andExpect(jsonPath("$.proximoVencimientoUsuarioRed", is("2026-08-15")));
    }

    @Test
    void getCounts_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/dashboard/counts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_impresoras"})
    void impresorasPorEstado_withReadAuthority_returns200() throws Exception {
        when(service.impresorasPorEstado()).thenReturn(
                List.of(new ModuloBreakdownItem("Operativa", 12L)));

        mockMvc.perform(get("/api/dashboard/impresoras-por-estado"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].label", is("Operativa")))
                .andExpect(jsonPath("$[0].count", is(12)));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void impresorasPorEstado_withoutReadAuthority_returns403() throws Exception {
        mockMvc.perform(get("/api/dashboard/impresoras-por-estado"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_solicitar-vpn"})
    void vpnPorEstadoSolicitud_withSolicitarVpnAuthority_returns200() throws Exception {
        when(service.vpnPorEstadoSolicitud()).thenReturn(
                List.of(new ModuloBreakdownItem("PENDIENTE", 2L)));

        mockMvc.perform(get("/api/dashboard/vpn-por-estado-solicitud"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].label", is("PENDIENTE")))
                .andExpect(jsonPath("$[0].count", is(2)));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void vpnPorEstadoSolicitud_withoutAnyVpnAuthority_returns403() throws Exception {
        mockMvc.perform(get("/api/dashboard/vpn-por-estado-solicitud"))
                .andExpect(status().isForbidden());
    }
}
