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
        request.setUsuario("jperez");
        request.setNombre("Juan Pérez");
        request.setTipo("OpenVPN");
        request.setIpAsignada("10.8.0.2");
        request.setVence(LocalDate.of(2025, 12, 31));
        request.setEstado("Activo");
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new Vpn(1L, "jperez", "Juan Pérez", "OpenVPN", "10.8.0.2", LocalDate.of(2025, 12, 31), "Activo")));

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(new Vpn(1L, "jperez", "Juan Pérez", "OpenVPN", "10.8.0.2", LocalDate.of(2025, 12, 31), "Activo"));

        mockMvc.perform(post("/api/vpn")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/vpn")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
