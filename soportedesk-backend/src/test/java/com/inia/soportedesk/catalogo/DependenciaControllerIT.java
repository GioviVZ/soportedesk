package com.inia.soportedesk.catalogo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class DependenciaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DependenciaService service;

    @Test
    @WithMockUser(authorities = "READ_catalogos")
    void findAll_filtersBySedeId() throws Exception {
        when(service.findAll(1L, null)).thenReturn(List.of(new Dependencia(1L, "TI", new Sede(1L, "Lima"))));

        mockMvc.perform(get("/api/catalogos/dependencias").param("sedeId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("TI")));
    }

    @Test
    @WithMockUser(authorities = "READ_catalogos")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        DependenciaRequest request = new DependenciaRequest();
        request.setNombre("TI");
        request.setSedeId(1L);

        mockMvc.perform(post("/api/catalogos/dependencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        DependenciaRequest request = new DependenciaRequest();
        request.setNombre("TI");
        request.setSedeId(1L);
        when(service.create(any())).thenReturn(new Dependencia(1L, "TI", new Sede(1L, "Lima")));

        mockMvc.perform(post("/api/catalogos/dependencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("TI")));
    }
}
