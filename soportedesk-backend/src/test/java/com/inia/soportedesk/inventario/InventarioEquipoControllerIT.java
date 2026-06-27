package com.inia.soportedesk.inventario;

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
class InventarioEquipoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InventarioEquipoService service;

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_inventario-equipos"})
    void getAll_withReadAuthority_returnsOk() throws Exception {
        when(service.getAll(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/inventario-equipos"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void getAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/inventario-equipos"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAll_withAdminRole_returnsOk() throws Exception {
        when(service.getAll(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/inventario-equipos"))
                .andExpect(status().isOk());
    }
}
