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
class SedeControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SedeService service;

    @Test
    @WithMockUser(authorities = "READ_catalogos")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new Sede(1L, "Lima")));

        mockMvc.perform(get("/api/catalogos/sedes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("Lima")));
    }

    @Test
    @WithMockUser(authorities = "READ_catalogos")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        SedeRequest request = new SedeRequest();
        request.setNombre("Lima");

        mockMvc.perform(post("/api/catalogos/sedes")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        SedeRequest request = new SedeRequest();
        request.setNombre("Lima");
        when(service.create(any())).thenReturn(new Sede(1L, "Lima"));

        mockMvc.perform(post("/api/catalogos/sedes")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("Lima")));
    }

    @Test
    void findAll_withoutAuthentication_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/catalogos/sedes"))
                .andExpect(status().isUnauthorized());
    }
}
