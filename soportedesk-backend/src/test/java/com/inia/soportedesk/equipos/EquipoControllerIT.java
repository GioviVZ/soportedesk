package com.inia.soportedesk.equipos;

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
class EquipoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EquipoService service;

    private EquipoRequest sampleRequest() {
        EquipoRequest request = new EquipoRequest();
        request.setNumeroSerie("SN-2024-001");
        request.setTipo("Laptop");
        request.setMarca("Dell");
        request.setModelo("Latitude 5540");
        request.setEstado("En uso");
        request.setAsignado(LocalDate.of(2024, 1, 10));
        return request;
    }

    private Equipo sampleEquipo() {
        Equipo equipo = new Equipo();
        equipo.setId(1L);
        equipo.setNumeroSerie("SN-2024-001");
        equipo.setTipo("Laptop");
        equipo.setMarca("Dell");
        equipo.setModelo("Latitude 5540");
        equipo.setEstado("En uso");
        return equipo;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleEquipo()));

        mockMvc.perform(get("/api/equipos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].numeroSerie", is("SN-2024-001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(sampleEquipo());

        mockMvc.perform(post("/api/equipos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.numeroSerie", is("SN-2024-001")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/equipos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
