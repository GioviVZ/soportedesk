package com.inia.soportedesk.auditoria;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MovimientoAuditoriaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MovimientoAuditoriaService service;

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_auditoria"})
    void buscar_withReadAuthority_returnsOk() throws Exception {
        when(service.buscar(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/auditoria/movimientos"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void buscar_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/auditoria/movimientos"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void buscar_withAdminRole_returnsOk() throws Exception {
        when(service.buscar(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/auditoria/movimientos"))
                .andExpect(status().isOk());
    }
}
